---
name: "development_workflows"
description: "Development workflow guidance for implementing and validating Leave Balance System changes."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Development Workflows (LBS)

## Standard Change Flow
1. Read relevant scope/domain/architecture docs.
2. Inspect current implementation before editing.
3. Apply surgical changes in the correct layer (UI/API/Prisma).
4. Run repository checks and manual role-flow verification where applicable.

## Core Commands
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm tsc --noEmit`
- `pnpm db:migrate` / `pnpm db:push` (when schema changes are needed)

## Working Rules
- Prefer existing helpers and conventions (`@/` imports, `queryKeys`, API client patterns).
- Keep API response style consistent with the file being edited.
- Preserve mutation audit logging behavior.
- Treat implemented code paths as canonical when docs drift.

## Role-Flow Awareness
- **Admin:** manages employees, leave types, settings, adjustments.
- **Manager:** approves/rejects leave requests and reviews team context.
- **Employee:** submits requests and tracks balances/history.

## Done Criteria for Fullstack Changes
- Updated behavior is reflected in both API and UI where required.
- Type safety remains intact (no unsafe casts or hidden failures).
- Error messages are explicit and actionable.

## Source of Truth
- `WORKFLOW.md`
- `AGENT.md`
- `docs/01-product-scope.md`
- `docs/03-system-architecture.md`
