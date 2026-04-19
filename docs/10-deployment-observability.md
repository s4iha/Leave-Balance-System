# 10 - Deployment & Observability
Last updated: 2026-04-17

## Environments
- **Development:** local Next.js dev server with PostgreSQL via Prisma (`DATABASE_URL`).
- **Production:** hosted Next.js app with a managed database.

## Build & Deploy
- Build: `pnpm build`
- Start: `pnpm start`
- Ensure `DATABASE_URL` and `NEXT_PUBLIC_APP_URL` are set.

## Logging
- Prisma logs queries/errors in development (`lib/db.ts`).
- Use server logs (platform logs in production) for API route errors.

## Monitoring (Future)
- Add health checks for `/api/v1/*` routes.
- Add error tracking to API routes and key UI flows.
