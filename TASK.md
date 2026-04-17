# Task Guide — Leave Balance System

## Purpose
Track work items and ensure PRAR-aligned delivery for the Faculty Leave System.

## Required Workflow
1. Follow `WORKFLOW.md` for PRAR lifecycle.
2. Consult core docs in `docs/` before implementing:
   - `01-product-scope.md`
   - `02-domain-model.md`
   - `03-system-architecture.md`
   - `08-security-compliance.md`
   - `09-testing-strategy.md`
   - `10-deployment-observability.md`
3. Update `docs/backlog.md` with status changes.

## Active Tasks (Sample)
- **LBS-001 — Define accrual calculation rules**  
  Status: todo  
  Notes: Use `AccrualScheme` and `BalanceRecord` fields from Prisma schema.

- **LBS-002 — Replace demo auth**  
  Status: todo  
  Notes: Current auth context is demo-only in `lib/auth-context.tsx`.

## Definition of Done
- Scope confirmed and documented.
- Relevant docs updated.
- Manual verification steps executed per `docs/09-testing-strategy.md`.
