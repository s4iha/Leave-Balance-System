# Prisma ORM 6 → 7 Migration Guide (Project Notes)

This file captures the Prisma ORM v7 upgrade requirements and how they map to this codebase.

## Prerequisites
- **Node.js**: 20.19.0+ (recommended 22.x)
- **TypeScript**: 5.4.0+ (recommended 5.9.x)

## Required Changes (v7)
1. **ESM + TypeScript config**
   - Prisma ORM ships as ESM.
   - `tsconfig.json` already uses `"module": "esnext"` and `"moduleResolution": "bundler"`.
   - If Node runtime issues appear, set `"type": "module"` in `package.json`.

2. **Schema generator update**
   - Use the new generator provider and required output path:
     ```prisma
     generator client {
       provider = "prisma-client"
       output   = "../generated/prisma"
     }
     ```

3. **Prisma Client output + imports**
   - Prisma Client is generated outside `node_modules`.
   - This project uses a **local re-export** module: `lib/prisma.ts`.
   - Code should import Prisma Client and enums from `@/lib/prisma`.

4. **Driver adapters**
   - Prisma Client instantiation must use a driver adapter.
   - For Postgres, use `@prisma/adapter-pg`:
     ```ts
     import { PrismaClient } from '@/lib/prisma';
     import { PrismaPg } from '@prisma/adapter-pg';

     const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
     export const prisma = new PrismaClient({ adapter });
     ```

5. **Prisma Config + env loading**
   - Prisma CLI no longer loads env vars automatically.
   - `prisma.config.ts` must import `dotenv/config`:
     ```ts
     import "dotenv/config";
     import { defineConfig, env } from "prisma/config";
     ```

6. **SSL defaults**
   - Prisma v7 uses node-postgres. If SSL errors appear, configure:
     ```ts
     const adapter = new PrismaPg({
       connectionString: process.env.DATABASE_URL,
       ssl: { rejectUnauthorized: false },
     });
     ```

## Project-Specific Checklist
- [ ] Update `prisma/schema.prisma` generator provider + output
- [ ] Ensure `lib/db.ts` uses `PrismaPg` adapter
- [ ] Update Prisma imports to `@/lib/prisma`
- [ ] Verify all API routes align with the Prisma schema (relations, fields)
- [ ] Run `npx prisma generate`, `pnpm tsc --noEmit`, and `pnpm lint`
