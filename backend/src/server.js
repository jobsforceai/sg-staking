import 'dotenv/config';
import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import { mkdir, readFile, writeFile } from 'fs/promises';
import multer from 'multer';
import path from 'path';

const app = express();
const port = Number(process.env.PORT || 8010);
const host = process.env.HOST || '127.0.0.1';
const dataFile = path.resolve(process.cwd(), 'data/purchase-codes.json');
const depositAddress = '0xBdbefFa8cf5469E3BBB2c21eA4f9BF3D4Ed63142';
const allowedProofTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, allowedProofTypes.has(file.mimetype)),
});

app.use(cors());
app.use(express.json());

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

const readCodes = async () => {
  try {
    return JSON.parse(await readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const writeCodes = async (codes) => {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(codes, null, 2));
};

const hashCode = (code) =>
  crypto.createHash('sha256').update(code).digest('hex');

const normalizeBuyerDetails = (body) => {
  const fullName = String(body.fullName || '').trim();
  const phoneNumber = String(body.phoneNumber || '').trim();
  const userId = String(body.userId || '').trim();

  if (!fullName) throw Object.assign(new Error('NAME_REQUIRED'), { statusCode: 400 });
  if (!phoneNumber) throw Object.assign(new Error('PHONE_REQUIRED'), { statusCode: 400 });
  if (fullName.length > 120) throw Object.assign(new Error('NAME_TOO_LONG'), { statusCode: 400 });
  if (phoneNumber.length > 30) throw Object.assign(new Error('PHONE_TOO_LONG'), { statusCode: 400 });
  if (userId.length > 120) throw Object.assign(new Error('USER_ID_TOO_LONG'), { statusCode: 400 });

  return { fullName, phoneNumber, userId: userId || null };
};

const normalizeEmail = (email) => {
  const value = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw Object.assign(new Error('EMAIL_REQUIRED'), { statusCode: 400 });
  }
  return value;
};

const createPurchaseCode = async ({ source, externalCode, amountUsd, amountSgc, sourceCurrency, sourceMeta, buyerDetails }) => {
  const externalCodeHash = hashCode(`${source}:${externalCode}`);
  const codes = await readCodes();
  if (codes.some((code) => code.externalCodeHash === externalCodeHash)) {
    throw Object.assign(new Error('COUPON_ALREADY_REDEEMED'), { statusCode: 409 });
  }

  const purchaseCode = `SGSTAKE-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
  const item = {
    id: crypto.randomUUID(),
    code: purchaseCode,
    source,
    externalCodeHash,
    amountUsd,
    amountSgc,
    sourceCurrency,
    status: 'ISSUED',
    buyerDetails,
    sourceMeta,
    createdAt: new Date().toISOString(),
  };

  codes.push(item);
  await writeCodes(codes);
  return item;
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
  res.json({ status: 'ok' });
});

app.get('/api/sgc/price', async (req, res, next) => {
  try {
    res.json({
      symbol: 'SGC',
      priceUsd: await getSgcPrice(),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/coupons/redeem', async (req, res, next) => {
  try {
    const source = String(req.body.source || '').toUpperCase();
    const code = String(req.body.code || '').trim();
    if (!code) throw Object.assign(new Error('CODE_REQUIRED'), { statusCode: 400 });
    const buyerDetails = normalizeBuyerDetails(req.body.buyerDetails || {});

    const sourceResult = await redeemSourceCoupon(source, code);
    const priceUsd = await getSgcPrice();
    const amountSgc = sourceResult.amountSgc ?? (priceUsd > 0 ? Number((sourceResult.amountUsd / priceUsd).toFixed(8)) : 0);
    const purchase = await createPurchaseCode({
      source,
      externalCode: code,
      amountUsd: sourceResult.amountUsd,
      amountSgc,
      sourceCurrency: sourceResult.sourceCurrency,
      sourceMeta: sourceResult.sourceMeta,
      buyerDetails,
    });

    res.status(201).json({
      status: 'SUCCESS',
      purchaseCode: purchase.code,
      amountUsd: purchase.amountUsd,
      amountSgc: purchase.amountSgc,
      sourceCurrency: purchase.sourceCurrency,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/crypto-deposits', upload.array('proofFiles', 3), async (req, res, next) => {
  try {
    const buyerDetails = normalizeBuyerDetails(req.body);
    const email = normalizeEmail(req.body.email);
    const coin = String(req.body.coin || '').toUpperCase();
    const amount = Number(req.body.amount || 0);
    const txHash = String(req.body.txHash || '').trim();

    if (!['ETH', 'USDT'].includes(coin)) throw Object.assign(new Error('INVALID_COIN'), { statusCode: 400 });
    if (!amount || amount <= 0) throw Object.assign(new Error('INVALID_AMOUNT'), { statusCode: 400 });
    if (!req.files?.length) throw Object.assign(new Error('PROOF_REQUIRED'), { statusCode: 400 });

    const form = new FormData();
    form.set('fullName', buyerDetails.fullName);
    form.set('phoneNumber', buyerDetails.phoneNumber);
    form.set('email', email);
    if (buyerDetails.userId) form.set('userId', buyerDetails.userId);
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

    res.status(201).json({
      status: 'PENDING_REVIEW',
      depositId: data.depositId,
      message: 'Deposit proof submitted for admin review.',
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/internal/crypto-deposits/:depositId/approve', async (req, res, next) => {
  try {
    if (req.headers['x-internal-secret'] !== process.env.SGSTAKING_INTERNAL_SECRET) {
      throw Object.assign(new Error('UNAUTHORIZED'), { statusCode: 401 });
    }

    const depositId = String(req.params.depositId || '').trim();
    const approvedAmountUsd = Number(req.body.approvedAmountUsd || 0);
    const coin = String(req.body.coin || '').toUpperCase();
    if (!depositId) throw Object.assign(new Error('DEPOSIT_ID_REQUIRED'), { statusCode: 400 });
    if (!approvedAmountUsd || approvedAmountUsd <= 0) throw Object.assign(new Error('INVALID_APPROVED_AMOUNT'), { statusCode: 400 });
    if (!['ETH', 'USDT'].includes(coin)) throw Object.assign(new Error('INVALID_COIN'), { statusCode: 400 });

    const priceUsd = await getSgcPrice();
    const purchase = await createPurchaseCode({
      source: 'CRYPTO',
      externalCode: depositId,
      amountUsd: approvedAmountUsd,
      amountSgc: priceUsd > 0 ? Number((approvedAmountUsd / priceUsd).toFixed(8)) : 0,
      sourceCurrency: coin,
      sourceMeta: {
        depositId,
        approvedBy: req.body.approvedBy,
        txHash: req.body.txHash,
      },
      buyerDetails: req.body.buyerDetails || {},
    });

    res.status(201).json({
      status: 'SUCCESS',
      purchaseCode: purchase.code,
      amountUsd: purchase.amountUsd,
      amountSgc: purchase.amountSgc,
      sourceCurrency: purchase.sourceCurrency,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/purchase-codes/redeem', (req, res) => {
  res.status(501).json({ message: 'Purchase code redemption is not implemented yet.' });
});

app.post('/api/sgc/buy', (req, res) => {
  res.status(410).json({ message: 'Use POST /api/coupons/redeem.' });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.code });
  }
  res.status(error.statusCode || 500).json({
    message: error.message || 'INTERNAL_SERVER_ERROR',
  });
});

app.listen(port, host, () => {
  console.log(`SG coin staking backend listening on http://${host}:${port}`);
});
