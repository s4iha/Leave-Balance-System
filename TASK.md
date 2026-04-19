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
  Status: todo  
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
  Status: todo  
  Notes: Use `AccrualScheme` and `BalanceRecord` fields from Prisma schema.

- **LBS-002 — Replace demo auth**  
  Status: todo  
  Notes: Current auth context is demo-only in `lib/auth-context.tsx`.

## Definition of Done
- Scope confirmed and documented.
- Relevant docs updated.
- Manual verification steps executed per `docs/09-testing-strategy.md`.
