---
title: RLS Recipes & Patterns
impact: CRITICAL
impactDescription: secure and correct access control patterns
tags: rls, security, patterns, cookbook
---

## RLS Recipes & Patterns

Common RLS patterns for Supabase, adapted for Hirebase.

### 1. Basic User Isolation (Agency)

**Scenario:** An Agency user should only see and modify their own Agency record.

**Pattern:**
```sql
-- Enable RLS
ALTER TABLE "Agency" ENABLE ROW LEVEL SECURITY;

-- Policy: Agency Owner Access
CREATE POLICY "Agency owners can do everything on own agency"
ON "Agency"
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);
```

### 2. Parent-Child Isolation (Jobs)

**Scenario:** A user should only see Jobs belonging to their Agency.

**Pattern:**
```sql
-- Enable RLS
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;

-- Policy: Agency Job Access
CREATE POLICY "Agencies can view own jobs"
ON "Job"
FOR SELECT
TO authenticated
USING (
  agencyID = auth.uid()::text -- Optimization: Avoid join if agencyID matches auth.uid
);

-- Note: If agencyID != auth.uid (e.g. multi-user agency), use:
-- USING ( agencyID IN ( SELECT id FROM "Agency" WHERE id = auth.uid()::text ) )
```

### 3. Public Read, Private Write (Job Board)

**Scenario:** Anyone (even anonymous users) can view active Jobs, but only Agencies can create/edit them.

**Pattern:**
```sql
-- Policy: Public View
CREATE POLICY "Public can view active jobs"
ON "Job"
FOR SELECT
TO anon, authenticated
USING (status = 'Active');

-- Policy: Agency Edit (Split Policy for security)
CREATE POLICY "Agencies can insert jobs"
ON "Job"
FOR INSERT
TO authenticated
WITH CHECK (agencyID = auth.uid()::text);

CREATE POLICY "Agencies can update own jobs"
ON "Job"
FOR UPDATE
TO authenticated
USING (agencyID = auth.uid()::text)
WITH CHECK (agencyID = auth.uid()::text);
```

### 4. Split Policies (Best Practice)

**Guideline:** Avoid `FOR ALL`. Split policies by operation (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) for clarity and security.

**Why:** `INSERT` uses `WITH CHECK`, `SELECT` uses `USING`, `UPDATE` uses both. Mixing them in `FOR ALL` can lead to unexpected behavior.

### 5. Accessing User Metadata

**Scenario:** Checking a user's plan (stored in `raw_app_meta_data`) to enforce limits.

**Pattern:**
```sql
CREATE POLICY "Pro plan only"
ON "AdvancedFeature"
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'plan') = 'pro'
);
```

### 6. Syntax Pitfalls

**Incorrect (Syntax Error):**
```sql
create policy "My Policy" on "Job"
to authenticated  -- WRONG: TO comes after FOR
for select
using (true);
```

**Correct:**
```sql
create policy "My Policy" on "Job"
for select        -- CORRECT
to authenticated
using (true);
```
