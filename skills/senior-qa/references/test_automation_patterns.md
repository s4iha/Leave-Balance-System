---
name: "test_automation_patterns"
description: "Automation patterns that fit Leave Balance System constraints and tooling."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Test Automation Patterns (LBS)

## Current Constraint
There is no single `pnpm test` script in this repository baseline. Automation should align with existing toolchain and avoid introducing heavy test scaffolding without explicit scope.

## Practical Automation Pattern
1. Gate each change with type and lint checks.
2. Add focused automated checks only where code already supports them.
3. Keep manual API/role-flow checks for business-critical workflows until broader test harness exists.

## Candidate Automated Targets
- Pure utility functions and domain calculations.
- Input validation helpers used by API routes.
- Query key and client state invalidation logic in shared data hooks.

## API Verification Pattern
- Exercise route handlers through HTTP calls against local dev server.
- Assert:
  - status code
  - response payload shape
  - side effects on domain entities and audit logs

## Anti-Patterns
- Creating brittle end-to-end suites detached from domain rules.
- Treating lint/typecheck as a substitute for workflow validation.
- Writing tests against placeholder data models instead of actual LBS entities.

## Source of Truth
- `docs/09-testing-strategy.md`
- `app/api/v1/**/route.ts`
- `lib/query-keys.ts`
