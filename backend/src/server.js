import 'dotenv/config';
import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const app = express();
const port = Number(process.env.PORT || 8010);
const host = process.env.HOST || '127.0.0.1';
const dataFile = path.resolve(process.cwd(), 'data/purchase-codes.json');

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

app.post('/api/purchase-codes/redeem', (req, res) => {
  res.status(501).json({ message: 'Purchase code redemption is not implemented yet.' });
});

app.post('/api/sgc/buy', (req, res) => {
  res.status(410).json({ message: 'Use POST /api/coupons/redeem.' });
});

app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    message: error.message || 'INTERNAL_SERVER_ERROR',
  });
});

app.listen(port, host, () => {
  console.log(`SG coin staking backend listening on http://${host}:${port}`);
});
