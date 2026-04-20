---
name: "backend_security_practices"
description: "Backend security practices tailored to Leave Balance System API and Prisma data access."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Backend Security Practices (LBS)

## Current Security Baseline
- API surface: `app/api/v1/**/route.ts`
- Data layer: Prisma + PostgreSQL (`lib/db.ts`, `prisma/schema.prisma`)
- Auth model in repo is currently demo-oriented (`lib/auth-context.tsx`), so API-side authorization checks remain critical.

## Mandatory Practices

### Input and output handling
- Validate body/query/path inputs before database calls.
- Return explicit errors (`400/401/403/404/409/500`) with actionable JSON payloads.
- Never expose internals (stack traces, raw SQL details) in responses.

### Authorization and role boundaries
- Model route permissions around `ADMIN`, `MANAGER`, `EMPLOYEE`.
- Protect approval and adjustment flows (`LeaveRequest`, `BalanceAdjustment`) from privilege escalation.
- Enforce ownership checks for employee-scoped reads/writes.

### Audit and accountability
- On mutating actions, write `AuditLog` entries with context:
  - actor user id
  - action type
  - target entity id
  - sanitized change metadata
- Do not log secrets, tokens, or unnecessary personal data.

### Data integrity and abuse resistance
- Guard against negative or invalid leave arithmetic when updating balances.
- Treat approval/rejection/cancel transitions as state-machine operations, not free-form updates.
- Keep operations idempotent where retries are likely.

## Anti-Patterns
- Relying only on client-side role gating for protected operations.
- Silent catch blocks that hide write failures.
- Coupling security decisions to UI state instead of server-side checks.

## Source of Truth
- `docs/08-security-compliance.md`
- `docs/02-domain-model.md`
- `docs/03-system-architecture.md`
