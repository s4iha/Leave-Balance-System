-- RLS policies for Leave Balance System

-- Helper functions (security definer for performance and reuse)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from "User" u
    where u.id = (select auth.uid())::text
      and u.role = 'ADMIN'
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from "User" u
    where u.id = (select auth.uid())::text
      and u.role = 'MANAGER'
  );
$$;

create or replace function public.is_self_employee(target_employee_id text)
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
      and e."userId" = (select auth.uid())::text
  );
$$;

create or replace function public.manages_employee(target_employee_id text)
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
      and e."managerId" = (select auth.uid())::text
  );
$$;

create or replace function public.can_access_employee(target_employee_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin()
     or public.is_self_employee(target_employee_id)
     or public.manages_employee(target_employee_id);
$$;

-- Indexes to support RLS predicates
create index if not exists "Employee_managerId_idx" on "Employee" ("managerId");

-- User
alter table "User" enable row level security;
alter table "User" force row level security;

create policy "user_select_self_managed_admin"
on "User"
for select
to authenticated
using (
  public.is_admin()
  or "User".id = (select auth.uid())::text
  or exists (
    select 1
    from "Employee" e
    where e."userId" = "User".id
      and e."managerId" = (select auth.uid())::text
  )
);

create policy "user_insert_admin"
on "User"
for insert
to authenticated
with check (public.is_admin());

create policy "user_update_admin"
on "User"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "user_delete_admin"
on "User"
for delete
to authenticated
using (public.is_admin());

-- Employee
alter table "Employee" enable row level security;
alter table "Employee" force row level security;

create policy "employee_select_access"
on "Employee"
for select
to authenticated
using (public.can_access_employee("Employee".id));

create policy "employee_insert_admin"
on "Employee"
for insert
to authenticated
with check (public.is_admin());

create policy "employee_update_admin"
on "Employee"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "employee_delete_admin"
on "Employee"
for delete
to authenticated
using (public.is_admin());

-- LeaveType (admin only)
alter table "LeaveType" enable row level security;
alter table "LeaveType" force row level security;

create policy "leave_type_select_admin"
on "LeaveType"
for select
to authenticated
using (public.is_admin());

create policy "leave_type_insert_admin"
on "LeaveType"
for insert
to authenticated
with check (public.is_admin());

create policy "leave_type_update_admin"
on "LeaveType"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "leave_type_delete_admin"
on "LeaveType"
for delete
to authenticated
using (public.is_admin());

-- BalanceRecord
alter table "BalanceRecord" enable row level security;
alter table "BalanceRecord" force row level security;

create policy "balance_record_select_access"
on "BalanceRecord"
for select
to authenticated
using (public.can_access_employee("BalanceRecord"."employeeId"));

create policy "balance_record_insert_admin"
on "BalanceRecord"
for insert
to authenticated
with check (public.is_admin());

create policy "balance_record_update_admin"
on "BalanceRecord"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "balance_record_delete_admin"
on "BalanceRecord"
for delete
to authenticated
using (public.is_admin());

-- LeaveRequest
alter table "LeaveRequest" enable row level security;
alter table "LeaveRequest" force row level security;

create policy "leave_request_select_access"
on "LeaveRequest"
for select
to authenticated
using (public.can_access_employee("LeaveRequest"."employeeId"));

create policy "leave_request_insert_admin_or_self"
on "LeaveRequest"
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_self_employee("LeaveRequest"."employeeId")
);

create policy "leave_request_update_access"
on "LeaveRequest"
for update
to authenticated
using (public.can_access_employee("LeaveRequest"."employeeId"))
with check (public.can_access_employee("LeaveRequest"."employeeId"));

create policy "leave_request_delete_admin_or_self"
on "LeaveRequest"
for delete
to authenticated
using (
  public.is_admin()
  or public.is_self_employee("LeaveRequest"."employeeId")
);

-- BalanceAdjustment
alter table "BalanceAdjustment" enable row level security;
alter table "BalanceAdjustment" force row level security;

create policy "balance_adjustment_select_access"
on "BalanceAdjustment"
for select
to authenticated
using (public.can_access_employee("BalanceAdjustment"."employeeId"));

create policy "balance_adjustment_insert_admin"
on "BalanceAdjustment"
for insert
to authenticated
with check (public.is_admin());

create policy "balance_adjustment_update_admin"
on "BalanceAdjustment"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "balance_adjustment_delete_admin"
on "BalanceAdjustment"
for delete
to authenticated
using (public.is_admin());

-- AuditLog (read access only)
alter table "AuditLog" enable row level security;
alter table "AuditLog" force row level security;

create policy "audit_log_select_access"
on "AuditLog"
for select
to authenticated
using (
  public.is_admin()
  or "AuditLog"."userId" = (select auth.uid())::text
  or (
    "AuditLog"."employeeId" is not null
    and public.can_access_employee("AuditLog"."employeeId")
  )
);

-- SystemSetting (admin only)
alter table "SystemSetting" enable row level security;
alter table "SystemSetting" force row level security;

create policy "system_setting_select_admin"
on "SystemSetting"
for select
to authenticated
using (public.is_admin());

create policy "system_setting_insert_admin"
on "SystemSetting"
for insert
to authenticated
with check (public.is_admin());

create policy "system_setting_update_admin"
on "SystemSetting"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "system_setting_delete_admin"
on "SystemSetting"
for delete
to authenticated
using (public.is_admin());

-- Department (admin only)
alter table "Department" enable row level security;
alter table "Department" force row level security;

create policy "department_select_admin"
on "Department"
for select
to authenticated
using (public.is_admin());

create policy "department_insert_admin"
on "Department"
for insert
to authenticated
with check (public.is_admin());

create policy "department_update_admin"
on "Department"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "department_delete_admin"
on "Department"
for delete
to authenticated
using (public.is_admin());
