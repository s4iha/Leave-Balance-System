# 02 - Domain Model
Last updated: 2026-04-17

## 1) Purpose
Define canonical entities and relationships based on `prisma/schema.prisma`.

---

## 2) Core Entities

### 2.1 User
- `id` (String, cuid)
- `email` (unique)
- `name`
- `role` (`ADMIN | MANAGER | EMPLOYEE`)
- `active` (boolean)
- Relationships: `employees`, `managedEmployees`, `leaveRequests`, `approvals`, `adjustments`, `auditLogs`

### 2.2 Employee
- `id`
- `userId` (FK → User)
- `departmentId` (FK → Department)
- `designation`
- `managerId` (FK → User, optional)
- `accrualScheme` (`MONTHLY | SEMESTER | ANNUAL`)
- `hireDate`
- `active` (boolean)
- Relationships: `department`, `leaveBalances`, `leaveRequests`, `adjustments`, `auditLogs`

### 2.3 LeaveType
- `id`
- `name` (unique)
- `description` (optional)
- `maxDaysPerYear`
- `requiresApproval` (boolean)
- `carryoverAllowed` (boolean)
- `carryoverMaxDays`, `carryoverExpiryDays` (optional)
- `active` (boolean)

### 2.4 BalanceRecord
- `id`
- `employeeId` (FK → Employee)
- `leaveTypeId` (FK → LeaveType)
- `year`
- `scheme` (AccrualScheme)
- `openingBalance`, `accrued`, `used`, `adjusted`, `closingBalance`, `carried`
- `lastAccrualDate`, `nextAccrualDate`

### 2.5 LeaveRequest
- `id`
- `employeeId` (FK → Employee)
- `leaveTypeId` (FK → LeaveType)
- `balanceRecordId` (FK → BalanceRecord)
- `startDate`, `endDate`, `durationDays`
- `reason`
- `status` (`DRAFT | SUBMITTED | APPROVED | REJECTED | CANCELLED`)
- `approvedBy` (FK → User, optional), `approvalDate`, `approvalNotes`

### 2.6 BalanceAdjustment
- `id`
- `employeeId` (FK → Employee)
- `leaveTypeId` (FK → LeaveType)
- `adjustmentType` (string)
- `adjustmentDays` (float; can be negative)
- `reason`
- `approvedBy` (FK → User), `approvalDate`, `effectiveDate`

### 2.7 AuditLog
- `id`
- `actionType` (`CREATE | UPDATE | DELETE | APPROVE | REJECT | CANCEL | ADJUSTMENT`)
- `userId` (FK → User)
- `employeeId`, `leaveRequestId`, `adjustmentId` (optional FKs)
- `description`
- `changes` (JSON string)
- `ipAddress`, `userAgent` (optional)

### 2.8 SystemSetting
- `id`
- `key` (unique)
- `value`

---

## 3) Relationships & Notes
- `User` represents login identity; `Employee` is the HR profile tied to a user.
- `BalanceRecord` is scoped to `{ employeeId, leaveTypeId, year }` and is the basis for request validation.
- `AuditLog` is created for mutating actions across employees, requests, and adjustments.

---

## 4) Explicit Unknowns
- Final rules for accrual calculation and cadence.
- Policy for auto‑approval vs mandatory approval by leave type.
