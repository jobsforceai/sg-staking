# Sagenex Requirements: SG Staking Crypto Deposit

SG Staking now supports a fourth path: users can deposit ETH or USDT to the shared wallet, upload proof, and wait for Sagenex admin approval.

Final `SGSTAKE-...` code generation happens only after admin approval.

## Public/Admin Intake Endpoint

SG Staking backend submits user proof to Sagenex:

```http
POST /api/v1/admin/sg-staking/crypto-deposits
X-Internal-Auth: Bearer <SAGENEX_INTERNAL_SECRET>
Content-Type: multipart/form-data
```

Fields:

```txt
fullName          required
phoneNumber       required
email             required
userId            optional
coin              required, ETH or USDT
amount            required, positive number
walletAddress     required
txHash            optional
proofFiles        required, max 3 files
```

File limits already enforced by SG Staking:

```txt
max files: 3
max file size: 5 MB each
allowed: jpg, png, webp, pdf
```

Expected success response:

```json
{
  "status": "PENDING_REVIEW",
  "depositId": "sagenex-deposit-id"
}
```

Sagenex should store the request as pending and show it in admin.

## Sagenex Admin UI

Admin should see:

```txt
fullName
phoneNumber
email
userId
coin
amount
walletAddress
txHash
proof files
status
createdAt
```

Admin actions:

```txt
Approve
Reject
```

On reject, Sagenex just marks it rejected and optionally emails the user.

On approve, Sagenex calls SG Staking to generate the final code.

## Approval Callback To SG Staking

```http
POST https://sg-staking-backend.onrender.com/api/internal/crypto-deposits/:depositId/approve
Content-Type: application/json
x-internal-secret: <SGSTAKING_INTERNAL_SECRET>
```

Body:

```json
{
  "approvedAmountUsd": 100,
  "coin": "USDT",
  "approvedBy": "admin-id",
  "txHash": "optional",
  "buyerDetails": {
    "fullName": "User Name",
    "phoneNumber": "9999999999",
    "userId": "optional-user-id"
  }
}
```

Success response:

```json
{
  "status": "SUCCESS",
  "purchaseCode": "SGSTAKE-...",
  "amountUsd": 100,
  "amountSgc": 0.23,
  "sourceCurrency": "USDT"
}
```

Sagenex should email `purchaseCode` to the user.

## Important Rules

- Do not call approve twice for the same `depositId`; SG Staking will reject duplicates.
- Sagenex should verify the chain transaction/payment before approval.
- Sagenex owns the admin review and email sending.
- SG Staking owns final code generation.
