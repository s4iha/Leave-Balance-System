# Copilot instructions

## Build, test, lint
- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Typecheck (from README):** `pnpm tsc --noEmit`
- **Tests:** No test runner/script is defined in `package.json`, so there is no single-test command available.

## Primary agent context
- `AGENT.md` is the global repository context for coding agents. Keep this file and these instructions consistent.
- When guidance conflicts, trust implemented behavior (`prisma/schema.prisma`, API route handlers, `lib/*`) over stale docs, then update docs.

## High-level architecture
- **Next.js App Router:** UI pages live under `app/*/page.tsx`. Shared shell is in `app/layout.tsx` and uses `components/providers.tsx` for theme + auth providers.
- **Client data layer:** TanStack Query is wired in `components/providers.tsx` and used for client-side API state.
- **API layer:** REST-style endpoints are in `app/api/v1/**/route.ts` and use Prisma via `lib/db.ts`.
- **Data layer:** Prisma schema is in `prisma/schema.prisma` with PostgreSQL datasource. Prisma Client is generated to `generated/prisma`, re-exported via `lib/prisma.ts`, and used as a singleton in `lib/db.ts` with `@prisma/adapter-pg`.
- **Auth model (demo):** `lib/auth-context.tsx` provides mock users stored in `localStorage`. UI role gating uses `components/auth/protected-route.tsx`.

## Key conventions
- **Path alias:** Use `@/` imports (configured in `tsconfig.json`).
- **UI components:** Shadcn/ui components live under `components/ui`; styling is Tailwind with `cn(...)` helper in `lib/utils.ts`.
- **Audit trail on mutations:** Many write endpoints create `prisma.auditLog` entries (see `app/api/v1/*` routes). Keep this pattern when adding mutating APIs.
- **Data fetching pattern:** Prefer `useQuery`/`useMutation` with `queryKeys` (`lib/query-keys.ts`) and API helpers (`lib/api-client.ts`) instead of component-local fetch effects.
- **API response shape:** Some v1 APIs return `{ success, data|error, message? }`, others return entity payloads directly. Follow the established shape in the route you’re editing for consistency.
- **Error handling:** Return explicit status codes and actionable JSON errors; avoid silent failure patterns.

## Docs to consult
- `docs/01-product-scope.md`, `docs/02-domain-model.md`, `docs/03-system-architecture.md`
- `docs/08-security-compliance.md`, `docs/09-testing-strategy.md`, `docs/10-deployment-observability.md`

## Database commands
- `pnpm db:push`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`, `pnpm db:reset`
