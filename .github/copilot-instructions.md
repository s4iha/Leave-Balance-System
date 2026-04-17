# Copilot instructions

## Build, test, lint
- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Typecheck (from README):** `pnpm tsc --noEmit`
- **Tests:** No test runner/script is defined in `package.json`, so there is no single-test command available.

## High-level architecture
- **Next.js App Router:** UI pages live under `app/*/page.tsx`. Shared shell is in `app/layout.tsx` and uses `components/providers.tsx` for theme + auth providers.
- **API layer:** REST-style endpoints are in `app/api/v1/**/route.ts` and use Prisma via `lib/db.ts`.
- **Data layer:** Prisma schema is in `prisma/schema.prisma`. The Prisma client is a singleton (`lib/db.ts`) to avoid multiple instances in dev.
- **Auth model (demo):** `lib/auth-context.tsx` provides mock users stored in `localStorage`. UI role gating uses `components/auth/protected-route.tsx`.

## Key conventions
- **Path alias:** Use `@/` imports (configured in `tsconfig.json`).
- **UI components:** Shadcn/ui components live under `components/ui`; styling is Tailwind with `cn(...)` helper in `lib/utils.ts`.
- **Audit trail on mutations:** Many write endpoints create `prisma.auditLog` entries (see `app/api/v1/*` routes). Keep this pattern when adding mutating APIs.
- **API response shape:** Some v1 APIs return `{ success, data|error, message? }`, others return entity payloads directly. Follow the established shape in the route you’re editing for consistency.

## Docs to consult
- `docs/01-product-scope.md`, `docs/02-domain-model.md`, `docs/03-system-architecture.md`
- `docs/08-security-compliance.md`, `docs/09-testing-strategy.md`, `docs/10-deployment-observability.md`

## Database commands
- `pnpm db:push`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`, `pnpm db:reset`
