# AGENT.md - Global Context for Repository Agents

## System Overview
Leave Balance System (LBS) is an internal HR application for managing employee leave balances, leave requests, approvals, and adjustments with an auditable history. The app serves three roles (Admin, Manager, Employee) through role-gated UI flows and a REST-style v1 API. Core behavior centers on leave policy configuration, balance tracking by accrual scheme, approval workflow, and compliance-oriented mutation logging.

## Tech Stack & Architecture
- **Framework/runtime:** Next.js App Router (`app/*`), React 19, TypeScript.
- **UI:** Tailwind CSS + shadcn/ui components in `components/ui`.
- **API layer:** Route handlers under `app/api/v1/**/route.ts`.
- **Data layer:** Prisma ORM with PostgreSQL datasource (`prisma/schema.prisma`) and `@prisma/adapter-pg` (`lib/db.ts`).
- **Prisma client:** Generated to `generated/prisma`, re-exported by `lib/prisma.ts`, consumed via singleton in `lib/db.ts`.
- **Auth model (current):** Demo auth in `lib/auth-context.tsx` (localStorage-backed), UI gate via `components/auth/protected-route.tsx`.
- **Core data flow:** UI -> `/api/v1/*` -> Prisma -> relational models + audit records.

## Domain Entities
- **User:** Identity and role (`ADMIN | MANAGER | EMPLOYEE`), with approvals, adjustments, and audit ownership.
- **Department:** Organizational unit for employees; referenced by employees via `departmentId`.
- **Employee:** HR profile tied to `User`; stores designation, optional manager, accrual scheme, and active flag.
- **LeaveType:** Policy definition (max days, approval requirement, carryover constraints).
- **BalanceRecord:** Per `{employeeId, leaveTypeId, year}` leave accounting snapshot (opening/accrued/used/adjusted/closing/carried and accrual dates).
- **LeaveRequest:** Request workflow record (`DRAFT | SUBMITTED | APPROVED | REJECTED | CANCELLED`) linked to balance context.
- **BalanceAdjustment:** Manual balance correction/bonus/deduction with approver metadata.
- **AuditLog:** Mutation history (`CREATE | UPDATE | DELETE | APPROVE | REJECT | CANCEL | ADJUSTMENT`) for traceability/compliance.
- **SystemSetting:** Key/value operational configuration.

## Strict Directives
- Treat `prisma/schema.prisma` and implemented route behavior as canonical when docs drift.
- Use `@/` path aliases for imports; follow existing module boundaries and naming patterns.
- Keep API route style consistent with the file being edited; do not force a global response envelope if a route already uses direct payloads.
- For mutating API operations, preserve/create `prisma.auditLog` entries with meaningful `actionType`, `description`, and `changes` when applicable.
- Validate request inputs explicitly and return clear HTTP status + JSON errors; do not hide errors with silent fallbacks.
- Preserve role-based behavior: UI authorization via `ProtectedRoute`, and API-side authorization must be explicit in route logic where required.
- Assume current auth is demo-only; do not claim production-grade auth guarantees unless implementation changes are present.
- Do not log secrets or sensitive personal data in plaintext; keep audit details focused on change metadata.
- Keep database assumptions PostgreSQL + Prisma adapter; do not introduce SQLite-specific guidance.
- Use existing project commands: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm tsc --noEmit`, `pnpm db:*`.
- Testing baseline: no first-class automated test script; rely on lint/typecheck plus manual role-flow verification from `docs/09-testing-strategy.md`.
- Prefer concise, deterministic, implementation-ready instructions; avoid speculative or conversational guidance.

## Working References
- Product: `docs/01-product-scope.md`
- Domain: `docs/02-domain-model.md`
- Architecture: `docs/03-system-architecture.md`
- Security/compliance: `docs/08-security-compliance.md`
- Testing: `docs/09-testing-strategy.md`
- Deployment/observability: `docs/10-deployment-observability.md`
- Agent operating defaults: `.github/copilot-instructions.md`
