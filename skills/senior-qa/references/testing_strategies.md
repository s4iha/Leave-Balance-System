---
name: "testing_strategies"
description: "Testing strategy for Leave Balance System domain, role permissions, and API workflows."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Testing Strategies (LBS)

## Strategy Priorities
1. **Business correctness first:** balance math and request lifecycle.
2. **Authorization second:** role boundaries for Admin/Manager/Employee.
3. **Operational quality third:** lint/type safety and API error quality.

## Scenario Matrix
- Employee submits leave request against valid balance.
- Manager approves/rejects with correct status transition and audit log.
- Admin performs balance adjustment with traceable justification.
- Invalid payloads and unauthorized actions return explicit errors.

## Validation Layers
- **Static checks:** `pnpm lint`, `pnpm tsc --noEmit`
- **Route behavior checks:** HTTP-level validation for `/api/v1/*`
- **Manual UI checks:** role-gated screens and workflow continuity

## Completion Criteria for QA Tasks
- No unresolved validation/authorization regressions.
- Domain entities remain consistent after mutations.
- Audit trails are present for mutating actions.

## Source of Truth
- `docs/09-testing-strategy.md`
- `docs/01-product-scope.md`
- `docs/02-domain-model.md`
