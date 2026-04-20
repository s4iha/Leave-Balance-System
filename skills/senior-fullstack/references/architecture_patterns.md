---
name: "architecture_patterns"
description: "Architecture patterns for Leave Balance System fullstack flows (UI, API, Prisma)."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Architecture Patterns (LBS)

## Primary Architecture
`UI (App Router)` -> `API route handlers (/api/v1/*)` -> `Prisma client` -> `PostgreSQL`

## Layer Responsibilities

### UI Layer (`app/*`, `components/*`)
- Build role-aware screens for Admin, Manager, Employee.
- Keep server-state in TanStack Query, not ad-hoc fetch effects.
- Reuse `queryKeys` and invalidate cache intentionally after writes.

### API Layer (`app/api/v1/**/route.ts`)
- Centralize business validation and authorization checks.
- Keep route response format consistent with existing file style.
- Record `AuditLog` on mutations that change domain state.

### Data Layer (`prisma/schema.prisma`, `lib/db.ts`)
- Keep entity relationships canonical to domain docs.
- Use Prisma + PostgreSQL conventions already in repo.
- Avoid schema/query assumptions that conflict with current model names.

## Domain-Centric Patterns
- `LeaveRequest` lifecycle: draft/submitted/approved/rejected/cancelled.
- `BalanceRecord` as source for year/type/employee leave accounting.
- `BalanceAdjustment` as controlled correction flow with approver metadata.

## Anti-Patterns
- Embedding domain rules only in UI logic.
- Bypassing query key conventions.
- Mutating critical entities without audit trail updates.

## Source of Truth
- `docs/01-product-scope.md`
- `docs/02-domain-model.md`
- `docs/03-system-architecture.md`
