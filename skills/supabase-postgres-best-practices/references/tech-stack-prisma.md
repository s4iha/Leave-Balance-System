---
title: Prisma & Supabase Optimization Guide
impact: CRITICAL
impactDescription: Prevents schema drift and performance issues
tags: prisma, supabase, optimization, rls, indexes
---

## Prisma with Supabase Best Practices

This guide bridges generic Postgres optimization rules to the Prisma ORM context used in this project.

### 1. Indexes & Constraints

**SQL Concept:** `CREATE INDEX`
**Prisma Implementation:** Use the `@@index` attribute in your model.

**Incorrect (Schema):**
```prisma
model Candidate {
  email String // Slow lookups by email
}
```

**Correct (Schema):**
```prisma
model Candidate {
  email String
  @@index([email]) // Fast lookups
}
```

### 2. Connection Pooling (Transaction Mode)

Supabase uses PgBouncer in **Transaction Mode** for connection pooling. This is critical for serverless environments (Next.js).

**Incorrect (Connection String):**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
```

**Correct (Connection String):**
Add `?pgbouncer=true` to the connection string for the Transaction Pooler (port 6543) and use a separate `DIRECT_URL` for migrations (port 5432).

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
```

### 3. Row Level Security (RLS)

**Critical Note:** Prisma Schema does **NOT** define RLS policies. RLS policies must be applied via raw SQL migrations or the Supabase Dashboard.

**Workflow:**
1. Enable RLS on tables in SQL:
   ```sql
   ALTER TABLE "Agency" ENABLE ROW LEVEL SECURITY;
   ```
2. Create Policies in SQL:
   ```sql
   CREATE POLICY "Agency owners can view own agency" ON "Agency"
   FOR SELECT USING (auth.uid() = id); -- Assuming id matches auth.uid() or via a link table
   ```
3. In App Code (Middleware/Context):
   Ensure the database client is initialized with the correct claims/user context if using RLS, or use the Service Role key to bypass RLS for administrative tasks.

### 4. Relations & Foreign Keys

Prisma handles foreign keys automatically with `@relation`, but explicit indexes on foreign keys are often needed for performance.

**Recommendation:** Always index foreign key fields (`agencyID`, `jobId`) unless the relation is 1:1 and unique.

```prisma
model Job {
  agencyID String
  @@index([agencyID]) // Explicit index for performance
}
```
