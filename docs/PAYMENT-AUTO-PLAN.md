# Payment Screenshot → Auto Plan Activation

Flow:
1. Signed-in shop owner uploads payment screenshot.
2. App creates a `payment_proofs` row with `pending` status and sends `payment_id`, `shop_id`, `owner_id`, and `screenshot_url` to the n8n webhook.
3. n8n uses a vision model to extract: `amount`, `transaction_id`, `date`, `time`, `sender_name`, `receiver_name`, plus confidence.
4. Deterministic validation must pass before activation:
   - receiver name normalized equals **Moe Htet Kyaw**
   - amount is exactly **50,000 MMK** → Starter or **80,000 MMK** → Business
   - transaction ID is present and unused
   - extraction confidence >= 0.92
5. n8n calls the server-side activation RPC/API. Do not update `shops.plan` directly from the browser.
6. Anything ambiguous goes to manual review; never auto-activate on low confidence.

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
  "amount": 80000,
  "transaction_id": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:mm:ss",
  "sender_name": "string",
  "receiver_name": "Moe Htet Kyaw",
  "confidence": 0.97
}
```

Security notes:
- Transaction ID uniqueness is enforced in Postgres.
- Browser users cannot execute the plan activation function.
- Screenshot OCR/vision output is treated as untrusted input and validated deterministically.
- A screenshot alone cannot prove settlement with bank-grade certainty; this flow verifies the receipt image, not the bank ledger. For higher assurance, add provider/API reconciliation before activation.
