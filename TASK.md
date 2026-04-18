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
- **LBS-PRISMA7 — Prisma v7 Readiness Audit**  
  Status: done  
  Plan:
  - Review Prisma v7 requirements and update migration guide.
  - Align Prisma client generation/output and driver adapter usage.
  - Audit API routes for schema mismatches and correct queries.
  - Run prisma generate, typecheck, and lint.
  Progress:
  - Updated Prisma v7 migration guide and data layer docs.
  - Switched Prisma client generation/output and added adapter usage.
  - Fixed Prisma route mismatches (relations/required fields).
  Validation:
  - `pnpm tsc --noEmit`
  - `pnpm lint`

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
