---
title: Leave Balance System Schema Optimizations
impact: HIGH
impactDescription: Faster access for employee, request, and balance workflows
tags: leave-balance, schema, indexes, performance
---

## Leave Balance System Schema Optimizations

Apply these index and schema notes to the Leave Balance System tables.

### 1. Table: `Employee`
- **Indexes:**
  - `managerId` is used by RLS and approvals filtering.
  - Ensure an index on `managerId`.

```sql
create index if not exists "Employee_managerId_idx" on "Employee" ("managerId");
```

### 2. Table: `LeaveRequest`
- **Indexes:** `employeeId`, `status` are already present in Prisma schema.
- **Note:** Keep these indexes for approvals and dashboard queries.

### 3. Table: `BalanceRecord`
- **Indexes:** `employeeId`, `leaveTypeId` are present for balance lookups.

### 4. Table: `BalanceAdjustment`
- **Indexes:** `employeeId`, `leaveTypeId` are present for audit and reporting.

### 5. Table: `AuditLog`
- **Indexes:** `userId`, `employeeId`, `createdAt` should remain to support audit views.
