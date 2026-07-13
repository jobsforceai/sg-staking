# SG Coin Staking Backend

Minimal Express backend for the SG coin staking app.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Routes

```http
GET /health
GET /api/sgc/price
POST /api/coupons/redeem
POST /api/purchase-codes/redeem
```

## Redeem Source Coupon

```http
POST /api/coupons/redeem
Content-Type: application/json
```

```json
{
  "source": "SAGENEX",
  "code": "coupon-code"
}
```

`source` can be `SAGENEX`, `SGTRADING`, or `SGCHAIN`.

Success:

```json
{
  "status": "SUCCESS",
  "purchaseCode": "SGSTAKE-...",
  "amountUsd": 100,
  "amountSgc": 0.54,
  "sourceCurrency": "USD"
}
```

`POST /api/purchase-codes/redeem` is intentionally a placeholder until the final destination backend is confirmed.
