# 03 - System Architecture
Last updated: 2026-04-17

## Project Summary
The Leave Balance System is a Next.js App Router application with a REST-style API layer backed by Prisma and a relational database. It supports role-based UI flows for Admin/Manager/Employee users.

---

## Core Systems
1. **UI Layer**
   - Pages in `app/*/page.tsx`
   - Shared layout in `app/layout.tsx`
   - Providers in `components/providers.tsx` (theme + auth)

2. **API Layer**
   - Routes in `app/api/v1/**/route.ts`
   - Prisma access via `lib/db.ts`
   - Audit logging for mutations

3. **Data Layer**
   - Prisma schema in `prisma/schema.prisma`
   - Prisma config in `prisma.config.ts` (env loading + CLI config)
   - Prisma Client generated to `generated/prisma` and re-exported from `lib/prisma.ts`
   - Driver adapter setup in `lib/db.ts` (`@prisma/adapter-pg`)
   - Tables for users, employees, leave types, balances, requests, adjustments, and audit logs

4. **Auth & Access**
   - Demo auth context in `lib/auth-context.tsx`
   - Role gating via `components/auth/protected-route.tsx`

---

## High-Level Data Flow
1. User logs in via demo auth context.
2. UI pages call `/api/v1/*` routes for CRUD actions.
3. API routes validate input, write to Prisma, and create audit logs.
4. UI updates reflect balances, requests, and approval state.

---

## Key Patterns
- App Router pages are client components only when they need hooks or localStorage.
- API routes use Prisma directly and return JSON responses.
- Mutations typically write `AuditLog` records.
