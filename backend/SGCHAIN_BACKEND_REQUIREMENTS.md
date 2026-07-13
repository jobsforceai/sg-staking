# SGChain Backend Integration For SG Coin Staking

The staking backend can call SGChain backend as a partner using the existing external-transfer redeem flow.

The SGChain backend code has been updated locally to support `SGSTAKING` as a target platform. Deployment still needs the shared secret configured.

## Required Env

```env
SGSTAKING_INTERNAL_SECRET=<shared secret>
```

Use the same value in staking backend:

```env
SGSTAKING_INTERNAL_SECRET=<same shared secret>
SGCHAIN_BACKEND_API_URL=<sgchain backend base url>
```

## Existing Endpoint To Extend

```http
POST /api/partner/external-transfer/redeem
Header: x-internal-secret: <SGSTAKING_INTERNAL_SECRET>
Content-Type: application/json
```

Request:

```json
{
  "code": "SGS-USD-ABC123",
  "targetPlatform": "SGSTAKING"
}
```

Response expected by staking backend:

```json
{
  "status": "SUCCESS",
  "amountUsd": 100,
  "originalAmount": 100,
  "currency": "USD",
  "transferId": "..."
}
```

For SGC-funded codes:

```json
{
  "status": "SUCCESS",
  "amountUsd": 100,
  "originalAmount": 10,
  "currency": "SGC",
  "transferId": "..."
}
```

## SGChain Backend Code Changes Included

1. Added `SGSTAKING_INTERNAL_SECRET` to env validation.
2. Added `SGSTAKING` to `ExternalTransfer.targetPlatform` enum.
3. Allows coupon generation with `targetPlatform: "SGSTAKING"`.
4. Allows partner redeem endpoint to accept `targetPlatform: "SGSTAKING"`.
5. Uses `SGSTAKING_INTERNAL_SECRET` when `targetPlatform === "SGSTAKING"`.
6. Validates that the code being redeemed was created for the same `targetPlatform`.

Important: item 6 prevents a valid partner secret from redeeming a code intended for another platform if the code is known.

## Suggested SGChain Code Prefix

```text
SGS-USD-XXXXXX
SGS-SGC-XXXXXX
```

No auth is needed on the staking site. The source coupon must be single-use and burned by SGChain backend during redemption.
