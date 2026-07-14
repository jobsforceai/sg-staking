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
POST /api/auth/signup
POST /api/auth/login
GET /api/me/dashboard
POST /api/coupons/redeem
POST /api/crypto-deposits
POST /api/withdrawals
```

## Auth

```http
POST /api/auth/signup
Content-Type: application/json
```

```json
{
  "fullName": "User Name",
  "phoneNumber": "9999999999",
  "email": "user@example.com",
  "password": "password123"
}
```

Login uses:

```http
POST /api/auth/login
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Both return:

```json
{
  "status": "SUCCESS",
  "token": "bearer-token",
  "user": {
    "id": "user-id",
    "fullName": "User Name",
    "phoneNumber": "9999999999",
    "email": "user@example.com"
  }
}
```

Use `Authorization: Bearer <token>` for dashboard, staking, deposit proof, and withdrawal routes.

## Redeem Source Coupon As Stake

```http
POST /api/coupons/redeem
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "source": "SAGENEX",
  "code": "coupon-code"
}
```

`source` can be `SAGENEX`, `OFFLINE`, or `SGCHAIN`.

Success:

```json
{
  "status": "SUCCESS",
  "stakeId": "stake-id",
  "amountUsd": 100,
  "amountSgc": 0.54,
  "sourceCurrency": "USD",
  "dashboard": {}
}
```

No purchase code is generated anymore. The approved amount is added directly to the logged-in user's dashboard as locked stake.

## Dashboard

```http
GET /api/me/dashboard
Authorization: Bearer <token>
```

Returns locked stake, accrued 30-day interest, withdrawable interest, allowed withdrawal methods, stakes, and withdrawals.

Interest policy:

```txt
3% every 30 days
principal is locked
only accrued interest is withdrawable
offline/cash stake can withdraw only cash
online/crypto stake can withdraw USDT or cash
```

## Withdraw Interest

```http
POST /api/withdrawals
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "method": "USDT",
  "amountUsd": 10,
  "walletAddress": "0x..."
}
```

`method` can be `USDT` or `CASH`. The backend rejects withdrawals above available accrued interest.

Success creates a Sagenex admin review:

```json
{
  "status": "PENDING_REVIEW",
  "withdrawal": {
    "id": "withdrawal-id",
    "status": "PENDING_REVIEW"
  }
}
```

Sagenex must approve or reject using:

```http
POST /api/internal/withdrawals/:withdrawalId/approve
POST /api/internal/withdrawals/:withdrawalId/reject
x-internal-secret: <SGSTAKING_INTERNAL_SECRET>
```
