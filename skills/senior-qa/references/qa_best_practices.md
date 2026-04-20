---
name: "qa_best_practices"
description: "Quality assurance best practices for Leave Balance System role flows and API behavior."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# QA Best Practices (LBS)

## QA Focus Areas
- Leave balance correctness across accrual/use/adjustment operations.
- Leave request lifecycle transitions and approval rules.
- Role-based access behavior for Admin, Manager, Employee.
- Audit trail generation for mutating operations.

## Environment-Aware Validation
- Use `pnpm dev` for live validation against `app/api/v1/*`.
- Verify static quality gates:
  - `pnpm lint`
  - `pnpm tsc --noEmit`
- Follow manual verification guidance in `docs/09-testing-strategy.md`.

## Test Design Rules
- Prefer scenario tests tied to real workflows (not synthetic placeholders).
- Cover both happy paths and role/validation failures.
- Validate status codes and error payload clarity.
- Confirm mutation side effects in both target entity and `AuditLog`.

## Common Regression Risks
- Incorrect balance arithmetic after approvals or adjustments.
- Invalid state transitions (`DRAFT` -> `APPROVED` without submission path).
- Route-level authorization gaps despite UI gating.
- Cache staleness after write operations when query invalidation is missing.

## Source of Truth
- `docs/01-product-scope.md`
- `docs/02-domain-model.md`
- `docs/09-testing-strategy.md`
