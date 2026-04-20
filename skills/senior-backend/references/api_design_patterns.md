---
name: "api_design_patterns"
description: "API design patterns for Leave Balance System route handlers and Prisma-backed mutations."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# API Design Patterns (LBS)

## Scope
Use this guide when editing `app/api/v1/**/route.ts` endpoints.

## Core Patterns

### 1. Keep route-local response style consistent
- Follow the response shape already used by the route you are editing.
- Do not force a global envelope if the file currently returns direct entity payloads.
- Always return explicit status codes and actionable JSON errors.

### 2. Validate request input before Prisma calls
- Parse and validate required IDs, enums, and dates near request entry.
- Reject invalid input with `400` and a clear `error` message.
- Keep validation rules aligned with `prisma/schema.prisma` field constraints.

### 3. Preserve auditable mutations
- For create/update/delete/approve/reject/cancel/adjustment actions, write `AuditLog` rows.
- Include meaningful `actionType`, `description`, and `changes` payload.
- Avoid storing secrets or raw sensitive values in audit details.

### 4. Enforce role intent in API logic
- UI role gating is not enough; enforce sensitive access in route handlers.
- Model route behavior around `ADMIN`, `MANAGER`, and `EMPLOYEE` responsibilities.
- If a route is role-sensitive, fail closed with explicit authorization errors.

## LBS Endpoint Design Checklist
- Endpoint behavior matches product workflow (employee request, manager approval, admin adjustments).
- Data access uses `lib/db.ts` Prisma singleton patterns.
- Error paths are deterministic and observable.
- Mutation endpoints maintain balance integrity and audit trail parity.

## Anti-Patterns
- Silent `try/catch` fallbacks that hide failures.
- Inconsistent status codes for equivalent validation failures.
- Writing business logic that drifts from domain entities (`LeaveRequest`, `BalanceRecord`, `BalanceAdjustment`).

## Source of Truth
- `docs/01-product-scope.md`
- `docs/02-domain-model.md`
- `docs/03-system-architecture.md`
- `prisma/schema.prisma`
