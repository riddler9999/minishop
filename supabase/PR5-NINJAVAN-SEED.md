# PR5 — Ninja Van verified seed migration

This PR adds an idempotent seed migration for the 11 Ninja Van Myanmar routes already captured in the repository.

Live production preflight:
- `public.ninjavan_rates` exists.
- current row count is `0`.
- delivery reconciliation migration is already applied.

Safety properties:
- fails closed when `public.ninjavan_rates` is missing,
- uses the existing unique route key,
- updates the fee/source and reactivates the matching row on conflict,
- does not delete, truncate, or deactivate unrelated rows,
- does not switch any shop from `custom` to `ninjavan`.

Source limitation:
The route values are the existing repository dataset labelled `Supplied Ninja Van Myanmar coverage chart`. This PR does not independently re-verify that external source.

Production application completed on 2026-09-25. The approved 11-route Yangon matrix was inserted/upserted and post-verified with 11 active rows.
