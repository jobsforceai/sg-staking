import 'dotenv/config';
import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import { mkdir, readFile, writeFile } from 'fs/promises';
import multer from 'multer';
import { MongoClient } from 'mongodb';
import path from 'path';
import { promisify } from 'util';

const app = express();
const build = 'staking-mongo-storage';
const port = Number(process.env.PORT || 8010);
const host = process.env.HOST || '127.0.0.1';
const dataDir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const mongoDbName = process.env.MONGODB_DB_NAME || 'sg_staking';
const depositAddress = '0xBdbefFa8cf5469E3BBB2c21eA4f9BF3D4Ed63142';
const allowedProofTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, allowedProofTypes.has(file.mimetype)),
});
const scrypt = promisify(crypto.scrypt);
const dayMs = 24 * 60 * 60 * 1000;
const stakingCycleMs = 30 * dayMs;
const interestRatePerCycle = 0.03;

app.use(cors());
app.use(express.json());

let mongoClient;
let mongoDb;
const dataFile = (name) => path.join(dataDir, name);
const collectionName = (name) => name.replace(/\.json$/, '');
const withoutMongoId = ({ _id, ...row }) => row;

const readJsonFile = async (name) => {
  try {
    return JSON.parse(await readFile(dataFile(name), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const connectDataStore = async () => {
  if (!process.env.MONGODB_URI) return;
  mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();
  mongoDb = mongoClient.db(mongoDbName);
  await mongoDb.collection('users').createIndex({ email: 1 }, { unique: true });
};

const migrateJsonToMongo = async () => {
  if (!mongoDb) return;
  for (const name of ['users.json', 'sessions.json', 'stakes.json', 'withdrawals.json', 'pending-crypto-deposits.json']) {
    const rows = await readJsonFile(name);
    if (!rows.length) continue;
    const collection = mongoDb.collection(collectionName(name));
    if (await collection.estimatedDocumentCount()) continue;
    await collection.insertMany(rows.map(withoutMongoId));
    console.log(`Migrated ${rows.length} ${name} rows to MongoDB.`);
  }
};

const readJson = async (name) => {
  if (mongoDb) {
    return mongoDb.collection(collectionName(name)).find({}, { projection: { _id: 0 } }).toArray();
  }
  return readJsonFile(name);
};

const writeJson = async (name, rows) => {
  if (mongoDb) {
    const collection = mongoDb.collection(collectionName(name));
    await collection.deleteMany({});
    if (rows.length) await collection.insertMany(rows.map(withoutMongoId));
    return;
  }
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile(name), JSON.stringify(rows, null, 2));
};

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

const jsonPost = async (url, headers, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.message || data.error || 'UPSTREAM_FAILED'), {
      statusCode: response.status,
      upstream: data,
    });
  }
  return data;
};

const getSgcPrice = async () => {
  if (process.env.SGC_PRICE_API_URL) {
    const response = await fetch(process.env.SGC_PRICE_API_URL);
    const data = await response.json();
    return Number(data.priceUsd || 0);
  }
  return Number(process.env.SGC_PRICE_USD || 0);
};

const normalizeEmail = (email) => {
  const value = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw Object.assign(new Error('EMAIL_REQUIRED'), { statusCode: 400 });
  }
  return value;
};

const normalizeAccountDetails = (body) => {
  const fullName = String(body.fullName || '').trim();
  const phoneNumber = String(body.phoneNumber || '').trim();
  const email = normalizeEmail(body.email);

  if (!fullName) throw Object.assign(new Error('NAME_REQUIRED'), { statusCode: 400 });
  if (!phoneNumber) throw Object.assign(new Error('PHONE_REQUIRED'), { statusCode: 400 });
  if (fullName.length > 120) throw Object.assign(new Error('NAME_TOO_LONG'), { statusCode: 400 });
  if (phoneNumber.length > 30) throw Object.assign(new Error('PHONE_TOO_LONG'), { statusCode: 400 });

  return { fullName, phoneNumber, email };
};

const normalizePassword = (password) => {
  const value = String(password || '');
  if (value.length < 8) throw Object.assign(new Error('PASSWORD_TOO_SHORT'), { statusCode: 400 });
  if (value.length > 200) throw Object.assign(new Error('PASSWORD_TOO_LONG'), { statusCode: 400 });
  return value;
};

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
};

const verifyPassword = async (password, stored) => {
  const [salt, key] = String(stored || '').split(':');
  if (!salt || !key) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(key, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const createSession = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = await readJson('sessions.json');
  sessions.push({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashCode(token),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * dayMs).toISOString(),
  });
  await writeJson('sessions.json', sessions);
  return token;
};

const getAuthUser = async (req) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw Object.assign(new Error('UNAUTHORIZED'), { statusCode: 401 });

  const sessions = await readJson('sessions.json');
  const session = sessions.find((item) => item.tokenHash === hashCode(token) && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) throw Object.assign(new Error('UNAUTHORIZED'), { statusCode: 401 });

  const users = await readJson('users.json');
  const user = users.find((item) => item.id === session.userId);
  if (!user) throw Object.assign(new Error('UNAUTHORIZED'), { statusCode: 401 });
  return user;
};

const requireAuth = (handler) => async (req, res, next) => {
  try {
    req.user = await getAuthUser(req);
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  phoneNumber: user.phoneNumber,
  email: user.email,
  createdAt: user.createdAt,
});

const requireInternalSecret = (req) => {
  const stakingSecret = process.env.SGSTAKING_INTERNAL_SECRET;
  if (!stakingSecret) throw Object.assign(new Error('SGSTAKING_INTERNAL_SECRET_NOT_CONFIGURED'), { statusCode: 500 });
  if (req.headers['x-internal-secret'] !== stakingSecret) throw Object.assign(new Error('UNAUTHORIZED'), { statusCode: 401 });
};

const stakeWithdrawalMethods = (source) => (source === 'OFFLINE' ? ['CASH'] : ['USDT', 'CASH']);

const createStake = async ({ userId, source, sourceRef, amountUsd, amountSgc, sourceCurrency, sourceMeta }) => {
  const stakes = await readJson('stakes.json');
  const sourceHash = hashCode(`${source}:${sourceRef}`);
  if (stakes.some((stake) => stake.sourceHash === sourceHash)) {
    throw Object.assign(new Error('STAKE_ALREADY_CREATED'), { statusCode: 409 });
  }

  const stake = {
    id: crypto.randomUUID(),
    userId,
    source,
    sourceHash,
    amountUsd,
    amountSgc,
    sourceCurrency,
    withdrawalMethods: stakeWithdrawalMethods(source),
    status: 'ACTIVE',
    sourceMeta,
    createdAt: new Date().toISOString(),
  };
  stakes.push(stake);
  await writeJson('stakes.json', stakes);
  return stake;
};

const accruedInterestUsd = (stake, now = Date.now()) => {
  if (stake.status !== 'ACTIVE') return 0;
  const cycles = Math.floor((now - new Date(stake.createdAt).getTime()) / stakingCycleMs);
  return Number((Math.max(cycles, 0) * Number(stake.amountUsd || 0) * interestRatePerCycle).toFixed(2));
};

const dashboardForUser = async (userId) => {
  const stakes = (await readJson('stakes.json')).filter((stake) => stake.userId === userId);
  const withdrawals = (await readJson('withdrawals.json')).filter((item) => item.userId === userId);
  const lockedWithdrawals = withdrawals.filter((item) => item.status !== 'REJECTED');
  const activeStakes = stakes.filter((stake) => stake.status === 'ACTIVE');
  const interestAccruedUsd = activeStakes.reduce((sum, stake) => sum + accruedInterestUsd(stake), 0);
  const interestLockedUsd = lockedWithdrawals.reduce((sum, item) => sum + Number(item.amountUsd || 0), 0);
  const withdrawableInterestUsd = Math.max(0, Number((interestAccruedUsd - interestLockedUsd).toFixed(2)));
  const interestForMethod = (method) =>
    activeStakes
      .filter((stake) => stake.withdrawalMethods.includes(method))
      .reduce((sum, stake) => sum + accruedInterestUsd(stake), 0);
  const lockedForMethod = (method) =>
    lockedWithdrawals
      .filter((item) => item.method === method)
      .reduce((sum, item) => sum + Number(item.amountUsd || 0), 0);

  return {
    stakedAmountUsd: Number(activeStakes.reduce((sum, stake) => sum + Number(stake.amountUsd || 0), 0).toFixed(2)),
    stakedAmountSgc: Number(activeStakes.reduce((sum, stake) => sum + Number(stake.amountSgc || 0), 0).toFixed(8)),
    interestAccruedUsd: Number(interestAccruedUsd.toFixed(2)),
    interestLockedUsd: Number(interestLockedUsd.toFixed(2)),
    withdrawableInterestUsd,
    withdrawableByMethod: {
      CASH: Math.max(0, Number((interestForMethod('CASH') - lockedForMethod('CASH')).toFixed(2))),
      USDT: Math.max(0, Number((interestForMethod('USDT') - lockedForMethod('USDT')).toFixed(2))),
    },
    stakes,
    withdrawals,
    interestPolicy: { ratePercent: 3, cycleDays: 30, principalLocked: true },
    disclaimer: 'Coin purchase or exchange may be restricted or illegal in India. Users are responsible for local compliance.',
  };
};

const redeemSourceCoupon = async (source, code) => {
  if (source === 'SAGENEX' || source === 'OFFLINE') {
    const data = await jsonPost(
      `${process.env.SAGENEX_API_URL}/internal/sgchain/execute-transfer`,
      { 'X-Internal-Auth': `Bearer ${process.env.SAGENEX_INTERNAL_SECRET}` },
      { transferCode: code, source }
    );
    if (data.status !== 'SUCCESS' || !data.transferredAmountUsd) {
      throw Object.assign(new Error(data.error || 'SAGENEX_COUPON_REDEEM_FAILED'), { statusCode: 400 });
    }
    return {
      amountUsd: Number(data.transferredAmountUsd),
      sourceCurrency: 'USD',
      sourceMeta: { sagenexUserId: data.sagenexUserId },
    };
  }

  if (source === 'SGCHAIN') {
    const data = await jsonPost(
      `${process.env.SGCHAIN_BACKEND_API_URL}/api/partner/external-transfer/redeem`,
      { 'x-internal-secret': process.env.SGSTAKING_INTERNAL_SECRET },
      { code, targetPlatform: 'SGSTAKING' }
    );
    if (data.status !== 'SUCCESS' || !data.amountUsd) {
      throw Object.assign(new Error(data.error || 'SGCHAIN_COUPON_REDEEM_FAILED'), { statusCode: 400 });
    }
    return {
      amountUsd: Number(data.amountUsd),
      amountSgc: data.currency === 'SGC' ? Number(data.originalAmount || 0) : undefined,
      sourceCurrency: data.currency || 'USD',
      sourceMeta: { transferId: data.transferId },
    };
  }

  throw Object.assign(new Error('INVALID_SOURCE'), { statusCode: 400 });
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', build, storage: mongoDb ? 'mongodb' : 'json' });
});

app.get('/api/sgc/price', async (req, res, next) => {
  try {
    res.json({ symbol: 'SGC', priceUsd: await getSgcPrice() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const details = normalizeAccountDetails(req.body);
    const passwordHash = await hashPassword(normalizePassword(req.body.password));
    const users = await readJson('users.json');
    if (users.some((user) => user.email === details.email)) {
      throw Object.assign(new Error('EMAIL_ALREADY_REGISTERED'), { statusCode: 409 });
    }

    const user = { id: crypto.randomUUID(), ...details, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
    await writeJson('users.json', users);
    res.status(201).json({ status: 'SUCCESS', token: await createSession(user.id), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = normalizePassword(req.body.password);
    const users = await readJson('users.json');
    const user = users.find((item) => item.email === email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw Object.assign(new Error('INVALID_LOGIN'), { statusCode: 401 });
    }
    res.json({ status: 'SUCCESS', token: await createSession(user.id), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/me/dashboard', requireAuth(async (req, res) => {
  res.json({ user: publicUser(req.user), dashboard: await dashboardForUser(req.user.id) });
}));

app.get('/api/internal/users', async (req, res, next) => {
  try {
    requireInternalSecret(req);
    const users = await readJson('users.json');
    res.json({ users: users.map(publicUser) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/coupons/redeem', requireAuth(async (req, res) => {
  const source = String(req.body.source || '').toUpperCase();
  const code = String(req.body.code || '').trim();
  if (!code) throw Object.assign(new Error('CODE_REQUIRED'), { statusCode: 400 });

  const sourceResult = await redeemSourceCoupon(source, code);
  const priceUsd = await getSgcPrice();
  const amountSgc = sourceResult.amountSgc ?? (priceUsd > 0 ? Number((sourceResult.amountUsd / priceUsd).toFixed(8)) : 0);
  const stake = await createStake({
    userId: req.user.id,
    source,
    sourceRef: code,
    amountUsd: sourceResult.amountUsd,
    amountSgc,
    sourceCurrency: sourceResult.sourceCurrency,
    sourceMeta: sourceResult.sourceMeta,
  });

  res.status(201).json({
    status: 'SUCCESS',
    stakeId: stake.id,
    amountUsd: stake.amountUsd,
    amountSgc: stake.amountSgc,
    sourceCurrency: stake.sourceCurrency,
    dashboard: await dashboardForUser(req.user.id),
  });
}));

app.post('/api/crypto-deposits', requireAuth(async (req, res, next) => {
  upload.array('proofFiles', 3)(req, res, async (uploadError) => {
    try {
      if (uploadError) throw uploadError;
      const coin = String(req.body.coin || '').toUpperCase();
      const amount = Number(req.body.amount || 0);
      const txHash = String(req.body.txHash || '').trim();
      if (!['ETH', 'USDT'].includes(coin)) throw Object.assign(new Error('INVALID_COIN'), { statusCode: 400 });
      if (!amount || amount <= 0) throw Object.assign(new Error('INVALID_AMOUNT'), { statusCode: 400 });
      if (!req.files?.length) throw Object.assign(new Error('PROOF_REQUIRED'), { statusCode: 400 });

      const form = new FormData();
      form.set('fullName', req.user.fullName);
      form.set('phoneNumber', req.user.phoneNumber);
      form.set('email', req.user.email);
      form.set('userId', req.user.id);
      form.set('coin', coin);
      form.set('amount', String(amount));
      form.set('walletAddress', depositAddress);
      if (txHash) form.set('txHash', txHash);

      for (const file of req.files) {
        form.append('proofFiles', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
      }

      const response = await fetch(`${process.env.SAGENEX_API_URL}/admin/sg-staking/crypto-deposits`, {
        method: 'POST',
        headers: { 'X-Internal-Auth': `Bearer ${process.env.SAGENEX_INTERNAL_SECRET}` },
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw Object.assign(new Error(data.message || data.error || 'SAGENEX_DEPOSIT_SUBMIT_FAILED'), {
          statusCode: response.status,
          upstream: data,
        });
      }

      const pending = await readJson('pending-crypto-deposits.json');
      pending.push({
        id: data.depositId,
        userId: req.user.id,
        coin,
        amount,
        txHash: txHash || null,
        status: 'PENDING_REVIEW',
        createdAt: new Date().toISOString(),
      });
      await writeJson('pending-crypto-deposits.json', pending);

      res.status(201).json({
        status: 'PENDING_REVIEW',
        depositId: data.depositId,
        message: 'Deposit proof submitted for admin review.',
      });
    } catch (error) {
      next(error);
    }
  });
}));

app.post('/api/internal/crypto-deposits/:depositId/approve', async (req, res, next) => {
  try {
    requireInternalSecret(req);

    const depositId = String(req.params.depositId || '').trim();
    const approvedAmountUsd = Number(req.body.approvedAmountUsd || 0);
    const coin = String(req.body.coin || '').toUpperCase();
    if (!depositId) throw Object.assign(new Error('DEPOSIT_ID_REQUIRED'), { statusCode: 400 });
    if (!approvedAmountUsd || approvedAmountUsd <= 0) throw Object.assign(new Error('INVALID_APPROVED_AMOUNT'), { statusCode: 400 });
    if (!['ETH', 'USDT'].includes(coin)) throw Object.assign(new Error('INVALID_COIN'), { statusCode: 400 });

    const pending = await readJson('pending-crypto-deposits.json');
    const localDeposit = pending.find((item) => item.id === depositId);
    const users = await readJson('users.json');
    const callbackEmail = String(req.body.buyerDetails?.email || '').trim().toLowerCase();
    const user = users.find((item) => item.id === localDeposit?.userId) || users.find((item) => item.email === callbackEmail);
    if (!user) throw Object.assign(new Error('STAKING_USER_NOT_FOUND'), { statusCode: 404 });

    const priceUsd = await getSgcPrice();
    const stake = await createStake({
      userId: user.id,
      source: 'CRYPTO',
      sourceRef: depositId,
      amountUsd: approvedAmountUsd,
      amountSgc: priceUsd > 0 ? Number((approvedAmountUsd / priceUsd).toFixed(8)) : 0,
      sourceCurrency: coin,
      sourceMeta: { depositId, approvedBy: req.body.approvedBy, txHash: req.body.txHash },
    });

    if (localDeposit) {
      localDeposit.status = 'APPROVED';
      localDeposit.stakeId = stake.id;
      localDeposit.approvedAt = new Date().toISOString();
      await writeJson('pending-crypto-deposits.json', pending);
    }

    res.status(201).json({
      status: 'SUCCESS',
      stakeId: stake.id,
      amountUsd: stake.amountUsd,
      amountSgc: stake.amountSgc,
      sourceCurrency: stake.sourceCurrency,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/withdrawals', requireAuth(async (req, res) => {
  const method = String(req.body.method || '').toUpperCase();
  const amountUsd = Number(req.body.amountUsd || 0);
  const walletAddress = String(req.body.walletAddress || '').trim();
  if (!['USDT', 'CASH'].includes(method)) throw Object.assign(new Error('INVALID_WITHDRAWAL_METHOD'), { statusCode: 400 });
  if (!amountUsd || amountUsd <= 0) throw Object.assign(new Error('INVALID_AMOUNT'), { statusCode: 400 });
  if (method === 'USDT' && !walletAddress) throw Object.assign(new Error('WALLET_ADDRESS_REQUIRED'), { statusCode: 400 });

  const dashboard = await dashboardForUser(req.user.id);
  if (amountUsd > dashboard.withdrawableByMethod[method]) {
    throw Object.assign(new Error('INSUFFICIENT_WITHDRAWABLE_INTEREST'), { statusCode: 400 });
  }

  const withdrawal = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    method,
    amountUsd,
    walletAddress: method === 'USDT' ? walletAddress : null,
    status: 'PENDING_REVIEW',
    createdAt: new Date().toISOString(),
  };

  const data = await jsonPost(
    `${process.env.SAGENEX_API_URL}/admin/sg-staking/withdrawals`,
    { 'X-Internal-Auth': `Bearer ${process.env.SAGENEX_INTERNAL_SECRET}` },
    {
      withdrawalId: withdrawal.id,
      user: publicUser(req.user),
      method,
      amountUsd,
      walletAddress: withdrawal.walletAddress,
    }
  );

  const withdrawals = await readJson('withdrawals.json');
  withdrawal.sagenexReviewId = data.withdrawalReviewId || null;
  withdrawals.push(withdrawal);
  await writeJson('withdrawals.json', withdrawals);
  res.status(201).json({ status: 'PENDING_REVIEW', withdrawal, dashboard: await dashboardForUser(req.user.id) });
}));

const updateWithdrawalFromSagenex = async (req, status) => {
  requireInternalSecret(req);

  const withdrawals = await readJson('withdrawals.json');
  const withdrawal = withdrawals.find((item) => item.id === String(req.params.withdrawalId || '').trim());
  if (!withdrawal) throw Object.assign(new Error('WITHDRAWAL_NOT_FOUND'), { statusCode: 404 });
  if (withdrawal.status !== 'PENDING_REVIEW') throw Object.assign(new Error('WITHDRAWAL_ALREADY_REVIEWED'), { statusCode: 409 });

  withdrawal.status = status;
  withdrawal.reviewedAt = new Date().toISOString();
  withdrawal.reviewedBy = req.body.reviewedBy || req.body.approvedBy || req.body.rejectedBy || null;
  withdrawal.transactionRef = req.body.transactionRef || null;
  withdrawal.rejectionReason = status === 'REJECTED' ? String(req.body.reason || '').trim() || null : null;
  await writeJson('withdrawals.json', withdrawals);
  return withdrawal;
};

app.post('/api/internal/withdrawals/:withdrawalId/approve', async (req, res, next) => {
  try {
    const withdrawal = await updateWithdrawalFromSagenex(req, 'APPROVED');
    res.json({ status: 'SUCCESS', withdrawal });
  } catch (error) {
    next(error);
  }
});

app.post('/api/internal/withdrawals/:withdrawalId/reject', async (req, res, next) => {
  try {
    const withdrawal = await updateWithdrawalFromSagenex(req, 'REJECTED');
    res.json({ status: 'SUCCESS', withdrawal });
  } catch (error) {
    next(error);
  }
});

app.post('/api/purchase-codes/redeem', (req, res) => {
  res.status(410).json({ message: 'Purchase codes are no longer used. Login and stake directly.' });
});

app.post('/api/sgc/buy', (req, res) => {
  res.status(410).json({ message: 'Use authenticated staking routes.' });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ message: error.code });
  res.status(error.statusCode || 500).json({ message: error.message || 'INTERNAL_SERVER_ERROR' });
});

const start = async () => {
  await connectDataStore();
  await migrateJsonToMongo();
  app.listen(port, host, () => {
    console.log(`SG coin staking backend ${build} listening on http://${host}:${port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
