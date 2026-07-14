# Sagenex Requirements: SG Staking Withdrawals

SG Staking withdrawal requests must be reviewed in Sagenex admin. SG Staking only marks the withdrawal approved or rejected after Sagenex calls back.

## Intake Endpoint Required On Sagenex

SG Staking calls Sagenex when a logged-in user requests interest withdrawal:

```http
POST /api/v1/admin/sg-staking/withdrawals
X-Internal-Auth: Bearer <SAGENEX_INTERNAL_SECRET>
Content-Type: application/json
```

Body:

```json
{
  "withdrawalId": "sg-staking-withdrawal-id",
  "user": {
    "id": "sg-staking-user-id",
    "fullName": "User Name",
    "phoneNumber": "9999999999",
    "email": "user@example.com"
  },
  "method": "USDT",
  "amountUsd": 10,
  "walletAddress": "0x..."
}
```

`method` is `USDT` or `CASH`. `walletAddress` is sent only for `USDT`.

Expected success:

```json
{
  "status": "PENDING_REVIEW",
  "withdrawalReviewId": "sagenex-review-id"
}
```

## Sagenex Admin UI

Admin should see:

```txt
withdrawalId
user fullName
user phoneNumber
user email
method
amountUsd
walletAddress
status
createdAt
```

Admin actions:

```txt
Approve
Reject
```

## Approval Callback To SG Staking

```http
POST https://sg-staking-backend.onrender.com/api/internal/withdrawals/:withdrawalId/approve
x-internal-secret: <SGSTAKING_INTERNAL_SECRET>
Content-Type: application/json
```

Body:

```json
{
  "approvedBy": "admin-id",
  "transactionRef": "optional payout tx/cash receipt reference"
}
```

Success:

```json
{
  "status": "SUCCESS",
  "withdrawal": {
    "id": "withdrawal-id",
    "status": "APPROVED"
  }
}
```

## Rejection Callback To SG Staking

```http
POST https://sg-staking-backend.onrender.com/api/internal/withdrawals/:withdrawalId/reject
x-internal-secret: <SGSTAKING_INTERNAL_SECRET>
Content-Type: application/json
```

Body:

```json
{
  "rejectedBy": "admin-id",
  "reason": "optional reason"
}
```

Rejected withdrawals stop locking the user's accrued interest, so the user can request again.

## Required Env

Sagenex backend:

```env
SAGENEX_INTERNAL_SECRET=<same shared secret used by SG Staking>
SGSTAKING_INTERNAL_SECRET=<same callback secret used by SG Staking>
SGSTAKING_API_URL=https://sg-staking-backend.onrender.com/api
```

SG Staking backend:

```env
SAGENEX_API_URL=https://sagenex-backend.onrender.com/api/v1
SAGENEX_INTERNAL_SECRET=<same shared secret used by Sagenex>
SGSTAKING_INTERNAL_SECRET=<same callback secret used by Sagenex>
```
