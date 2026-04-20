---
name: "tech_stack_guide"
description: "Canonical Leave Balance System stack and integration guidance."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Tech Stack Guide (LBS)

## Canonical Stack
- **Framework/runtime:** Next.js App Router + React + TypeScript
- **Styling/UI:** Tailwind CSS + shadcn/ui
- **Client state/data:** TanStack Query
- **API:** Route handlers in `app/api/v1/**/route.ts`
- **ORM/database:** Prisma + PostgreSQL with `@prisma/adapter-pg`
- **Prisma client output:** `generated/prisma` re-exported via `lib/prisma.ts`

## Key Integration Points
- `components/providers.tsx`: theme + auth + query providers
- `lib/db.ts`: Prisma singleton and adapter wiring
- `lib/query-keys.ts`: shared query keys for cache consistency
- `lib/api-client.ts`: client API helper usage pattern

## Domain-Critical Models
- `User`, `Employee`, `Department`
- `LeaveType`, `BalanceRecord`, `LeaveRequest`
- `BalanceAdjustment`, `AuditLog`, `SystemSetting`

## Working Constraints
- Use `@/` path aliases.
- Preserve existing route response conventions per file.
- Keep mutation pathways auditable.
- Assume auth context is demo-only unless explicitly replaced.

## Source of Truth
- `AGENT.md`
- `docs/02-domain-model.md`
- `docs/03-system-architecture.md`
- `prisma/schema.prisma`
