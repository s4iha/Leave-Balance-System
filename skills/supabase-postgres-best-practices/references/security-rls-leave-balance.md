---
title: Leave Balance System RLS Policies
impact: CRITICAL
impactDescription: Prevents cross-user data exposure in core HR tables
tags: rls, security, leave-balance, supabase
---

## Leave Balance System RLS Policies

Use helper functions and split policies to enforce Admin/Manager/Employee access without expensive per-row checks.

**Incorrect (heavy per-row checks, unclear access):**

```sql
-- auth.uid() evaluated per row and mixed logic in one policy
create policy "leave_request_all"
on "LeaveRequest"
for all
to authenticated
using (
  exists (
    select 1 from "Employee" e
    where e.id = "LeaveRequest".employeeId
      and (e.userId = auth.uid() or e.managerId = auth.uid())
  )
);
```

**Correct (helper functions + split policies):**

```sql
-- Helper functions (security definer)
create or replace function public.can_access_employee(target_employee_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from "Employee" e
    where e.id = target_employee_id
      and (
        e.userId = (select auth.uid())
        or e.managerId = (select auth.uid())
      )
  )
  or exists (
    select 1
    from "User" u
    where u.id = (select auth.uid())
      and u.role = 'ADMIN'
  );
$$;

-- Split policies per operation
create policy "leave_request_select_access"
on "LeaveRequest"
for select
to authenticated
using (public.can_access_employee("LeaveRequest".employeeId));

create policy "leave_request_insert_admin_or_self"
on "LeaveRequest"
for insert
to authenticated
with check (
  public.can_access_employee("LeaveRequest".employeeId)
);
```

**Why this works:**
- `auth.uid()` is wrapped in `select` to avoid per-row re-evaluation.
- Access logic is centralized and reusable.
- Policies are split to avoid unexpected `FOR ALL` behavior.
