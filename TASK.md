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

- **LBS-CRUD-V1 — Verify v1 API CRUD**  
  Status: done  
  Plan:
  - Inventory all `app/api/v1` endpoints and map CRUD coverage.
  - Run live HTTP CRUD checks against v1 endpoints.
  - Reproduce and fix failures for leave-types, settings, users role, and employees.
  - Re-verify all endpoints and document validation steps.
  Progress:
  - Ran live CRUD requests across v1 endpoints, including leave-types, settings, users role, and employees.
  - Verified role history, audit logs, balances, requests, adjustments, and reports.
  - No code changes required after verification.
  Validation:
  - `pnpm dev` + live HTTP requests per `docs/09-testing-strategy.md`

- **LBS-000 — Build AGENT.md global context for repository agents**  
  Status: done  
  Objective:
  - Synthesize distributed project docs into a single high-signal `AGENT.md` that can be used as baseline system context for future AI agents.
  - Use guidance from `skills/prompt-engineer` to keep instructions explicit, constrained, and output-oriented.
  Scope:
  - Read and align the source docs: `docs/01-product-scope.md`, `docs/02-domain-model.md`, `docs/03-system-architecture.md`, `docs/08-security-compliance.md`, and `docs/09-testing-strategy.md`.
  - Reconcile conflicts or drift against current repository behavior and update `.github/copilot-instructions.md` only if required for consistency.
  Required Output (`AGENT.md` at repo root):
  - **System Overview**: 2-3 definitive sentences on product purpose and primary user flows.
  - **Tech Stack & Architecture**: explicit frameworks, runtime, data layer, and integration patterns.
  - **Domain Entities**: concise mapping of core models and relationships.
  - **Strict Directives**: non-negotiable coding, security, and testing rules in unambiguous bullet points.
  Quality Constraints:
  - Markdown only; concise and deterministic language; no fluff, narrative, or speculative statements.
  - Every directive must be traceable to the source docs or current codebase conventions.
  Acceptance Criteria:
  - `AGENT.md` is created in project root with all required sections.
  - Content is internally consistent and actionable for implementation tasks without extra context.

- **LBS-001 — Define accrual calculation rules**  
  Status: todo (verify first if completed) 
  Notes: Use `AccrualScheme` and `BalanceRecord` fields from Prisma schema.

- **LBS-002 — Replace demo auth**  
  Status: done  
  Notes: Current auth context is demo-only in `lib/auth-context.tsx`.
 
- **LBS-003 — Refactor and rewrite boilerplate references file of the skills**  
  Status: done  
  Canonical task spec: `skills/prompt-engineer/references/lbs-003-refactor-skill-references.md`  
  Summary: rewrite generic skill `references/*.md` boilerplates into repository-specific Markdown guidance without changing each skill's core purpose.

- **LBS-004 — Bugs Found & Quality Improvements**
  Status: todo

  Objective:
  - Refactor and resolve 11 distinct bugs/features grouped into 5 categories.
  - Each subtask has explicit acceptance criteria, test scenarios, and Definition of Done.
  - No status transition from 'todo' to 'done' until all acceptance criteria verified.

  **Subtasks:**

  1. **LBS-004-001 — Sidebar Collapsible Feature**
     - Goal: Enable collapsible sidebar using shadcn component
     - Acceptance: Toggle button, state persistence, responsive, no layout shift
     - Test: Manual UI testing per qa-validation.md
     - Component: `components/Sidebar.tsx` or root layout

  2. **LBS-004-002 — Delete Leave Type (Actual Deletion)**
     - Goal: Replace "mark inactive" with true deletion or soft-delete with UX
     - Acceptance: Delete removes from dropdowns/lists, audit trail, cascading handled
     - Test: Manual CRUD verification, audit log check, API validation
     - Component: `app/leave-types/page.tsx`, API: `app/api/v1/leave-types/[id]`

  3. **LBS-004-003 — Delete Employee (Actual Deletion)**
     - Goal: Replace "mark inactive" with true deletion or soft-delete with UX
     - Acceptance: Delete removes from lists, cascading handled (requests/balances), audit trail
     - Test: Manual CRUD verification, cascade check, API validation
     - Component: `app/employees/page.tsx`, API: `app/api/v1/employees/[id]`

  4. **LBS-004-004 — Start/End Date Validation**
     - Goal: Enforce robust date validation (no past dates, end > start)
     - Acceptance: Client-side real-time validation, server-side 400 rejection, clear errors
     - Test: Manual form testing, API bypass testing
     - Component: `app/my-requests/page.tsx`, API: `app/api/v1/requests`

  5. **LBS-004-005 — End Date Cannot Equal or Precede Start Date**
     - Goal: Enforce strict endDate > startDate constraint
     - Acceptance: Validation `endDate > startDate` (not >=), date picker disabled for invalid dates
     - Test: Manual form testing, edge cases (same date)
     - Component: `app/my-requests/page.tsx`, API: `app/api/v1/requests`

  6. **LBS-004-006 — Real-time Leave Types Dropdown**
     - Goal: Dropdown always shows current active leave types, no stale data
     - Acceptance: Fetch on mount, cache invalidation after mutations, no hardcoded data
     - Test: Create/update/delete type, verify dropdown refreshes < 1 second
     - Component: `app/my-requests/page.tsx`, API: `app/api/v1/leave-types?status=active`

  7. **LBS-004-007 — Manager Role - Hide Actions in Employees Page**
     - Goal: Managers cannot see Actions column (create/edit/delete disabled)
     - Acceptance: Column conditionally hidden by role, API rejects manager mutations (403)
     - Test: Test both manager and admin roles, API bypass testing
     - Component: `app/employees/page.tsx`, API: role-check middleware

  8. **LBS-004-008 — Manager Role - Hide Actions in My Requests Page**
     - Goal: Managers cannot see Actions column in requests (read-only)
     - Acceptance: Column conditionally hidden by role, API rejects manager mutations (403)
     - Test: Test both manager and admin roles, API bypass testing
     - Component: `app/my-requests/page.tsx`, API: role-check middleware

  9. **LBS-004-009 — Pagination & Export in Audit Logs**
     - Goal: Enable pagination and CSV/JSON export for audit logs
     - Acceptance: Pagination controls, export button, filtered export, performance < 5 sec for 1000 records
     - Test: Manual pagination/export testing, performance check
     - Component: Audit Logs section (path TBD), API: `app/api/v1/audit-logs?limit=X&offset=Y`

  10. **LBS-004-010 — Change Role Functionality Not Working**
      - Goal: Implement working role change in User Access page
      - Acceptance: Dialog/modal, role update persisted, audit trail, cannot change own role
      - Test: Manual role change testing, audit log verification
      - Component: User Access page (path TBD), API: `app/api/v1/users/[id]/role`

  11. **LBS-004-011 — Dashboard - Real-time Stats and Recent Requests**
      - Goal: Display real-time statistics and recent requests, no hardcoded data
      - Acceptance: Stats from API aggregations, cache invalidation after mutations, < 2 sec load time
      - Test: Create/approve requests, verify counts update, performance check
      - Component: `app/dashboard/page.tsx`, API: `app/api/v1/dashboard/stats`, `app/api/v1/requests`

  Quality Constraints:
  - Every subtask has documented acceptance criteria verified before status → done
  - Manual testing steps documented in session artifacts: `lbs-004-qa-validation.md`
  - Validation: `pnpm lint`, `pnpm tsc --noEmit`, `pnpm build` must pass
  - Audit logs created for all mutating operations
  - Role-based access control enforced server-side (not just UI)

  Acceptance Criteria (Parent Task):
  - All 11 subtasks have explicit, testable acceptance criteria
  - Each subtask manually tested per qa-validation.md test scenarios
  - No regression: existing admin/manager/employee flows still work
  - Status transition to 'done' only after verification sign-off per qa-validation.md checklist



## Definition of Done
- Scope confirmed and documented.
- Relevant docs updated.
- Manual verification steps executed per `docs/09-testing-strategy.md`.
