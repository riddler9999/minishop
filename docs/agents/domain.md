# Domain documentation

MiniShop uses a **single-context** domain-document layout.

- Read root `CONTEXT.md` before architecture, domain-model, billing, tenancy, checkout, or plan changes.
- Read relevant ADRs under `docs/adr/` before changing an established invariant.
- `CONTEXT.md` describes current domain language and current invariants only.
- `PROJECT.md` remains the project history/status log; historical decisions there may describe superseded behaviour.
- When a durable architectural decision changes, add or supersede an ADR and update `CONTEXT.md` in the same change.
