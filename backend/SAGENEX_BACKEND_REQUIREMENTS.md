# Sagenex Backend Requirements for SG Coin Staking

SG Coin Staking can accept purchase funds from Sagenex by redeeming a coupon/transfer code generated on the Sagenex side.

The staking backend does not have Sagenex DB access, so Sagenex must expose one internal API for code verification and consumption.

## Required Endpoint

`POST /internal/sgchain/execute-transfer`

Base URL is configured in staking as:

```env
SAGENEX_API_URL=https://<sagenex-backend-host>/api/v1
SAGENEX_INTERNAL_SECRET=<shared-secret>
```

Full URL used by staking:

```txt
POST {SAGENEX_API_URL}/internal/sgchain/execute-transfer
```

## Authentication

Header:

```http
X-Internal-Auth: Bearer <SAGENEX_INTERNAL_SECRET>
Content-Type: application/json
```

Return `401 Unauthorized` when the secret is missing or invalid.

## Request Body

```json
{
  "transferCode": "SAGENEX-USER-GENERATED-CODE"
}
```

## Success Response

Return this only after the code has been verified and consumed atomically.

```json
{
  "status": "SUCCESS",
  "sagenexUserId": "user-id-or-wallet-id",
  "transferredAmountUsd": 100
}
```

Rules:

- `transferredAmountUsd` must be a positive number.
- The code must be single-use.
- The code must be marked consumed in the same transaction/check that validates it.
- Expired, reused, cancelled, or invalid codes must not return `SUCCESS`.

## Failure Response

```json
{
  "status": "FAILED",
  "error": "INVALID_CODE"
}
```

Recommended error values:

- `INVALID_CODE`
- `CODE_ALREADY_USED`
- `CODE_EXPIRED`
- `INVALID_AMOUNT`
- `TRANSFER_NOT_APPROVED`

HTTP status can be `400` for invalid/reused/expired codes and `500` for unexpected server errors.

## Staking Backend Behavior

After Sagenex returns `SUCCESS`, staking will:

1. Create a locked stake for the logged-in SG Staking user.
2. Store the purchase amount in USD and calculated SGC.
3. Reject future attempts to redeem the same external Sagenex code.

SG Staking login is required before this flow.
