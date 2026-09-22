# Payment Screenshot → Auto Plan Activation

Flow:
1. Signed-in shop owner uploads payment screenshot.
2. App creates a `payment_proofs` row with `pending` status and sends `payment_id`, `shop_id`, `owner_id`, and `screenshot_url` to the n8n webhook.
3. n8n uses a vision model to extract: `amount`, `transaction_id`, `date`, `time`, `sender_name`, `receiver_name`, plus confidence.
4. n8n calls the server-side activation RPC/API. Do not update `shops.plan` directly from the browser or workflow; activation must reconcile `shops.plan` and `shop_entitlements` together.
5. The RPC validates untrusted extraction and persists the result:
   - valid receiver + supported amount (30,000 Starter / 60,000 Business) + unique transaction ID + confidence >= 0.92 → `approved` and activate Starter/Business through the entitlement-aware subscription path
   - missing transaction ID or confidence < 0.92 → `manual_review`, no plan activation
   - unsupported amount, receiver mismatch, or duplicate transaction ID → `rejected`, no plan activation
6. `rejection_reason` stores the deterministic reason code so operations can review failures without relying on workflow logs.

Required webhook payload from app:
```json
{
  "payment_id": "uuid",
  "shop_id": "uuid",
  "owner_id": "uuid",
  "screenshot_url": "https://..."
}
```

Expected verified extraction:
```json
{
  "amount": 60000,
  "transaction_id": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:mm:ss",
  "sender_name": "string",
  "receiver_name": "Moe Htet Kyaw",
  "confidence": 0.97
}
```

Security notes:
- Transaction IDs are trimmed before comparison/storage and uniqueness is enforced in Postgres.
- Browser users cannot execute the plan activation function.
- Screenshot OCR/vision output is treated as untrusted input and validated deterministically.
- A screenshot alone cannot prove settlement with bank-grade certainty; this flow verifies the receipt image, not the bank ledger. For higher assurance, add provider/API reconciliation before activation.


## Current pricing contract

- Starter: 30,000 Ks
- Business: 60,000 Ks
- The historical 50,000/80,000 amounts in migration 0011 are superseded by migration 0017.
- Never edit an already-applied migration to change runtime truth; add a later reconciliation migration instead.
