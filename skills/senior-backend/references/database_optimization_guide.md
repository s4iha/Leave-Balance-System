---
name: "database_optimization_guide"
description: "PostgreSQL + Prisma optimization guidance for Leave Balance System write/read paths."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Database Optimization Guide (LBS)

## Scope
Optimize Prisma-backed queries and mutations in leave balances, requests, approvals, and audit trails.

## High-Impact Patterns

### 1. Query by real domain keys
- Prefer filtering by constrained keys used in LBS flows:
  - `employeeId`, `leaveTypeId`, `year` for balance records
  - request status and date windows for manager queues
- Avoid broad table scans for dashboards and reports.

### 2. Keep write transactions short
- Group only logically atomic operations (e.g., balance update + request status + audit log).
- Avoid long-lived transactions that hold locks across unrelated operations.

### 3. Select only needed fields
- Use targeted Prisma `select`/`include` in list endpoints.
- Keep API payloads small for role dashboards and approval queues.

### 4. Index where workflows demand it
- Verify index coverage for common filters and joins in leave workflows.
- Re-check indexes after schema changes in `prisma/schema.prisma`.
- Align index design with real query shapes, not generic assumptions.

## Mutation Integrity Rules
- Balance updates must preserve arithmetic consistency (`opening`, `accrued`, `used`, `adjusted`, `closing`).
- Approval/rejection/cancel updates should enforce valid state transitions.
- Keep audit logging in the same logical unit as the mutation path.

## Operational Commands
- `pnpm db:migrate`
- `pnpm db:push`
- `pnpm db:studio`
- `pnpm tsc --noEmit`
- `pnpm lint`

## Anti-Patterns
- Over-fetching relations for list pages.
- Mixing reporting reads into transactional writes.
- Introducing SQLite-specific assumptions in a PostgreSQL-oriented stack.

## Source of Truth
- `docs/03-system-architecture.md`
- `docs/02-domain-model.md`
- `prisma/schema.prisma`
