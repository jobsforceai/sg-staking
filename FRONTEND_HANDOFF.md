# SG Staking Frontend Handoff

Backend base URL:

```env
NEXT_PUBLIC_STAKING_API_URL=https://sg-staking-backend.onrender.com
```

## Current Status

Backend is live with login, dashboard, staking, crypto deposit review, and withdrawal review.

Frontend still needs to be updated from the old public coupon-code page to the new logged-in dashboard flow.

## Required Screens

```txt
/signup
/login
/dashboard
```

The old public redeem/deposit forms should move inside `/dashboard` and require a bearer token.

## Auth APIs

### Signup

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

Success:

```json
{
  "status": "SUCCESS",
  "token": "token",
  "user": {
    "id": "user-id",
    "fullName": "User Name",
    "phoneNumber": "9999999999",
    "email": "user@example.com"
  }
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Store `token` client-side and send:

```http
Authorization: Bearer <token>
```

## Dashboard API

```http
GET /api/me/dashboard
Authorization: Bearer <token>
```

Use these fields:

```json
{
  "dashboard": {
    "stakedAmountUsd": 0,
    "stakedAmountSgc": 0,
    "interestAccruedUsd": 0,
    "interestLockedUsd": 0,
    "withdrawableInterestUsd": 0,
    "withdrawableByMethod": {
      "CASH": 0,
      "USDT": 0
    },
    "stakes": [],
    "withdrawals": [],
    "interestPolicy": {
      "ratePercent": 3,
      "cycleDays": 30,
      "principalLocked": true
    },
    "disclaimer": "Coin purchase or exchange may be restricted or illegal in India. Users are responsible for local compliance."
  }
}
```

Show:

```txt
Total staked USD
Total staked SGC
Accrued interest
Withdrawable interest
Pending/approved/rejected withdrawals
Stake history
3% every 30 days
Principal locked
India legal disclaimer
```

## Stake With Coupon

```http
POST /api/coupons/redeem
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "source": "SGCHAIN",
  "code": "coupon-code"
}
```

`source` values:

```txt
SGCHAIN
SAGENEX
OFFLINE
```

Success now creates a stake directly:

```json
{
  "status": "SUCCESS",
  "stakeId": "stake-id",
  "amountUsd": 100,
  "amountSgc": 50,
  "sourceCurrency": "USD",
  "dashboard": {}
}
```

Important: do not show any one-time `SGSTAKE-...` code. Purchase codes are no longer used.

## Crypto Deposit Proof

```http
POST /api/crypto-deposits
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Fields:

```txt
coin        required: ETH or USDT
amount      required positive number
txHash      optional
proofFiles  required, max 3 files
```

File limits:

```txt
max files: 3
max size: 5 MB each
allowed: jpg, png, webp, pdf
```

Success:

```json
{
  "status": "PENDING_REVIEW",
  "depositId": "sagenex-deposit-id",
  "message": "Deposit proof submitted for admin review."
}
```

Sagenex admin approves this. After approval, SG Staking dashboard will show the new stake.

Deposit wallet shown in UI:

```txt
0xBdbefFa8cf5469E3BBB2c21eA4f9BF3D4Ed63142
```

Trust Wallet links:

```txt
ETH:
https://link.trustwallet.com/send?address=0xBdbefFa8cf5469E3BBB2c21eA4f9BF3D4Ed63142&asset=c60

USDT:
https://link.trustwallet.com/send?asset=c60_t0xdAC17F958D2ee523a2206206994597C13D831ec7&address=0xBdbefFa8cf5469E3BBB2c21eA4f9BF3D4Ed63142
```

## Withdraw Interest

```http
POST /api/withdrawals
Authorization: Bearer <token>
Content-Type: application/json
```

USDT:

```json
{
  "method": "USDT",
  "amountUsd": 10,
  "walletAddress": "0x..."
}
```

Cash:

```json
{
  "method": "CASH",
  "amountUsd": 10
}
```

Rules:

```txt
Only interest is withdrawable.
Principal/staked amount is locked.
Offline/cash stake can withdraw only CASH.
Crypto/online stake can withdraw USDT or CASH.
Withdrawal goes to Sagenex admin review first.
```

Success:

```json
{
  "status": "PENDING_REVIEW",
  "withdrawal": {
    "id": "withdrawal-id",
    "status": "PENDING_REVIEW"
  },
  "dashboard": {}
}
```

## Required Frontend Changes

```txt
1. Add signup/login pages.
2. Store auth token and attach Authorization header.
3. Redirect unauthenticated users to login.
4. Replace public landing flow with authenticated dashboard.
5. Move coupon staking form into dashboard.
6. Move crypto deposit form into dashboard.
7. Add withdrawal form using dashboard.withdrawableByMethod.
8. Remove all SGSTAKE/purchase-code UI and "visible once" messaging.
9. Show pending/approved/rejected withdrawal status.
10. Show legal disclaimer clearly.
11. Convert/translate UI copy to Arabic if final Dubai-language requirement means Arabic.
12. Keep English fallback if team confirms Dubai-language means UAE English tone instead of Arabic.
```

## Backend Docs

Sagenex withdrawal docs:

```txt
backend/SAGENEX_WITHDRAWAL_REQUIREMENTS.md
```

Sagenex crypto deposit docs:

```txt
backend/SAGENEX_CRYPTO_DEPOSIT_REQUIREMENTS.md
```
