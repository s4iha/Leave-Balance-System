# University of Perpetual Help System - Manila
## Faculty Leave and Balance Tracking & Management System

A comprehensive enterprise HR application for managing employee leave balances, requests, and approvals. Designed with role-gated UI workflows, strict audit compliance, and robust background engines for automated calculations.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Sub-Project / Component Breakdown](#3-sub-project--component-breakdown)
4. [Tech Stack & Dependencies](#4-tech-stack--dependencies)
5. [Detailed Feature Highlights](#5-detailed-feature-highlights)
6. [Relational Database Schema](#6-relational-database-schema)
7. [Project Folder Structure](#7-project-folder-structure)
8. [Local Setup & Installation Guide](#8-local-setup--installation-guide)
9. [API Documentation](#9-api-documentation)
10. [Security & Best Practices Summary](#10-security--best-practices-summary)
11. [Collaborator & Developer Guide](#11-collaborator--developer-guide)
12. [Troubleshooting](#12-troubleshooting)
13. [License & Ownership](#13-license--ownership)

---

## 1. Project Overview

The Leave Balance Tracking System is an enterprise HR solution designed for the University of Perpetual Help System - Manila to manage employee leave policies, track leave balances across multiple accrual schemes (Monthly, Semester, Annual), process leave requests, and maintain comprehensive audit trails for compliance.

### Key Objectives
- **Centralized Leave Management**: Keep track of dynamic leave balances across employee classifications and accrual schemes.
- **Approval Workflow**: Streamlined multi-tier approval system with real-time pending counters.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions matrix separating Admin, Manager, and Employee operations.
- **Compliance & Audit Trail**: Complete tracking of all system mutations to preserve audit integrity.

---

## 2. System Architecture

The following diagram illustrates the client-server relationship, core application engines, database layer, and external cron trigger flow:

```mermaid
graph TD
    %% Clients
    subgraph ClientTier ["Client Tier (Browser)"]
        UI["React 19 / Next.js Client Components"]
        TSQ["TanStack Query (State & Cache)"]
        RHF["React Hook Form + Zod (Validation)"]
        UI --> TSQ
        UI --> RHF
    end

    %% Application Server
    subgraph AppServerTier ["Application Server (Next.js & Engines)"]
        API["REST API Route Handlers (/api/v1/*)"]
        Pages["Server Pages & Layouts (App Router)"]
        AuthCtx["Auth Context (LocalStorage / Role-Gated UI)"]
        
        subgraph Engines ["Core Engines"]
            AccrualEngine["Automated Accrual Engine (Transactional Safety)"]
            HolidayEngine["Rule-Based Holiday Engine (Lazy Generation)"]
        end
    end

    %% Database Tier
    subgraph DataTier ["Data Tier"]
        Prisma["Prisma ORM (Client Generation)"]
        DB[(PostgreSQL Database)]
    end

    %% External Triggers
    subgraph External ["External Services"]
        CronTrigger["Secure Cron Trigger / Scheduled Triggers"]
    end

    %% Connections
    UI -- "HTTPS REST API Requests" --> API
    UI -- "HTML/Server Render Requests" --> Pages
    API -- "Authentication Validation" --> AuthCtx
    
    API --> Engines
    CronTrigger -- "Secured Webhook Hook" --> API
    
    API -- "Data Operations" --> Prisma
    Pages -- "Server-side Queries" --> Prisma
    AccrualEngine -- "Atomic Operations" --> Prisma
    HolidayEngine -- "Compute Occurrences" --> Prisma
    
    Prisma -- "Query / Mutations via PG Adapter" --> DB
```

---

## 3. Sub-Project / Component Breakdown

As a full-stack Next.js web application, the system is organized into several key architectural components:

1. **Frontend Dashboard & Core UI**: Built using React 19, Tailwind CSS, and shadcn/ui. Implements a responsive, dashboard-centric interface with widgets for leave status monitoring, approval panels, and visual graphs representing balance metrics.
2. **REST API Interface**: A secure endpoint architecture (`/api/v1/*`) enforcing parameter validation using Zod and performing granular permission checks.
3. **Automated Accrual Engine**: Processes balance increments on demand or via cron triggers. Implements safe database transitions to prevent balance mismatches.
4. **Rule-Based Holiday Engine**: Handles the automatic, lazy calculation of holiday schedules based on dynamic configurations (e.g. Fixed date, Nth Weekday, or Relative dates with weekend offset rules).
5. **Role-Based Access Control (RBAC)**: Supports roles and permissions with an administrative permission matrix interface that allows modifying allowed actions for system roles.

---

## 4. Tech Stack & Dependencies

### Frontend
- **Next.js 16** - React Framework (App Router)
- **React 19** - UI Library
- **TypeScript 5.7** - Type safety and autocomplete
- **Tailwind CSS 4** - Styling framework
- **Shadcn/UI & Radix UI** - Reusable UI component libraries
- **React Hook Form + Zod** - Client-side form handling and strict validations
- **TanStack Query** - Server-state synchronization, caching, and mutation tracking
- **Recharts** - Interactive data visualization charts
- **Lucide React** - Vector icons
- **Sonner** - Alert toast notifications
- **Next-themes** - Light/Dark mode transitions

### Backend & Database
- **Next.js Route Handlers** - REST-based API controller tier
- **Prisma ORM** - Database client generation and migration engine
- **PostgreSQL** - Primary relational data storage
- **Prisma PostgreSQL Adapter** - High-performance database driver wrapper (`@prisma/adapter-pg`)

---

## 5. Detailed Feature Highlights

* **Role-Based Workflows**:
  - **Admin**: Full master data management (Leave Types, Departments, Classifications), manual balance adjustments, settings configuration, and granular role/permission adjustments.
  - **Manager**: Team member list views, direct report tracking, and leave request review (Approval/Rejection).
  - **Employee**: Leave balance breakdowns, personal submission histories, and request creation.
* **Automated Accrual Engine**:
  - Increments balances based on Monthly, Semester, and Annual schemes.
  - Secures execution using `CRON_SECRET` tokens.
  - Prevents double-accruals with calendar execution logs and transaction safety.
* **Holiday Engine (Lazy Generation)**:
  - Dynamically populates holiday occurrences on a rolling calendar basis.
  - Integrates offset rules, automatically shifting weekend holidays (e.g., Sunday → Monday).
  - Allows manual date overrides and one-off holiday exceptions.
* **Settings & Access Hub**:
  - Permission Matrix Row-by-Row controls for assigning permissions to roles.
  - Custom policy definitions binding Employee Classifications to specific Leave Types.
* **Audit Trail & Logging**:
  - Record history for all create, update, delete, approval, rejection, and adjustment operations.
  - Capture metadata (actor IP addresses, browser user agents) and JSON changes payloads.

---

## 6. Relational Database Schema

Below are details of the database tables defined in `prisma/schema.prisma`:

### `User`
Tracks system credentials, login statuses, and ties to employee records.
| Field | Type | Nullable | Key/Default | Description / Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | No | PK / `cuid()` | Unique ID |
| `email` | `String` | No | Unique | Login email address |
| `name` | `String` | No | | User's full name |
| `roleId` | `String` | No | FK | Reference to `Role(id)` |
| `password` | `String` | Yes | | Hashed password |
| `requiresPasswordChange` | `Boolean` | No | `false` | Force update on first login |
| `active` | `Boolean` | No | `true` | Account active state |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | | Update timestamp |

### `Role`
Defines system access roles (e.g. Admin, Manager, Employee).
| Field | Type | Nullable | Key/Default | Description / Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | No | PK / `cuid()` | Unique ID |
| `name` | `String` | No | Unique | Role name |
| `description` | `String` | Yes | | Role description |
| `color` | `String` | Yes | | Color representation in UI |
| `isSystem` | `Boolean` | No | `false` | System protected role flag |

### `Permission`
Fine-grained actions on specific resources.
| Field | Type | Nullable | Key/Default | Description / Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | No | PK / `cuid()` | Unique ID |
| `action` | `String` | No | | Action name (e.g., `CREATE`, `APPROVE`) |
| `resource` | `String` | No | | Resource name (e.g., `LEAVE_REQUEST`, `USER`) |
| `description` | `String` | Yes | | Explanatory description |
| Unique constraint: `[action, resource]` |

### `RolePermission`
Many-to-many relationship mapping roles to specific permissions.
| Field | Type | Nullable | Key/Default | Description / Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | No | PK / `cuid()` | Unique ID |
| `roleId` | `String` | No | FK | Reference to `Role(id)` |
| `permissionId` | `String` | No | FK | Reference to `Permission(id)` |
| Unique constraint: `[roleId, permissionId]` |

### `Employee`
Core HR profile linked to a system user, classification, and department.
| Field | Type | Nullable | Key/Default | Description / Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | No | PK / `cuid()` | Unique ID |
| `userId` | `String` | No | FK / Unique | Reference to `User(id)` |
| `departmentId` | `String` | No | FK | Reference to `Department(id)` |
| `designation` | `String` | No | | Job title |
| `managerId` | `String` | Yes | FK | Reference to `User(id)` |
| `accrualScheme` | `Enum` | No | `MONTHLY` | Scheme (`MONTHLY`, `SEMESTER`, `ANNUAL`) |
| `hireDate` | `DateTime` | No | | Hiring Date |
| `accrualStartDate` | `DateTime` | Yes | | Custom start for accruals |
| `gender` | `Enum` | Yes | | Gender options |
| `employeeNumber` | `String` | Yes | Unique | Employee card/number identifier |
| `timeZone` | `String` | Yes | `UTC` | Timezone |
| `workHoursPerDay` | `Float` | Yes | `8` | Operational day hours |
| `active` | `Boolean` | No | `true` | Profile active status |
| `classificationId` | `String` | Yes | FK | Reference to `EmployeeClassification(id)` |

### `LeaveType`
Configure policies for various leaves (e.g., Vacation, Sick Leave).
| Field | Type | Nullable | Key/Default | Description / Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | No | PK / `cuid()` | Unique ID |
| `name` | `String` | No | Unique | Name of leave type |
| `description` | `String` | Yes | | Purpose details |
| `maxDaysPerYear` | `Int` | No | | Total annual allocation |
| `requiresApproval` | `Boolean` | No | `true` | Manager approval required flag |
| `carryoverAllowed` | `Boolean` | No | `false` | Carryover configuration |
| `carryoverMaxDays` | `Int` | Yes | | Max days to carryover |
| `carryoverExpiryDays`| `Int` | Yes | | Expiry offset |
| `active` | `Boolean` | No | `true` | Availability state |

### `BalanceRecord`
Tracks leave days allocation, accruals, adjustments, and usage per year.
| Field | Type | Nullable | Key/Default | Description / Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | No | PK / `cuid()` | Unique ID |
| `employeeId` | `String` | No | FK | Reference to `Employee(id)` |
| `leaveTypeId` | `String` | No | FK | Reference to `LeaveType(id)` |
| `year` | `Int` | No | | Target calendar year |
| `scheme` | `Enum` | No | | Scheme identifier |
| `openingBalance` | `Float` | No | | Base balance at start of period |
| `accrued` | `Float` | No | | Accrued days during year |
| `used` | `Float` | No | | Used days |
| `adjusted` | `Float` | No | | Manual adjustments |
| `closingBalance` | `Float` | No | | Current available balance |
| `carried` | `Float` | No | | Carried over balance from prior period |
| `lastAccrualDate` | `DateTime` | No | | Timestamp of last accrual run |
| `nextAccrualDate` | `DateTime` | No | | Timestamp of next accrual |
| Unique constraint: `[employeeId, leaveTypeId, year]` |

### `LeaveRequest`
Manages workflow state transitions for individual leave requests.
| Field | Type | Nullable | Key/Default | Description / Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | No | PK / `cuid()` | Unique ID |
| `employeeId` | `String` | No | FK | Reference to `Employee(id)` |
| `leaveTypeId` | `String` | No | FK | Reference to `LeaveType(id)` |
| `balanceRecordId`| `String` | No | FK | Reference to `BalanceRecord(id)` |
| `startDate` | `DateTime` | No | | Start date |
| `endDate` | `DateTime` | No | | End date |
| `durationDays` | `Float` | No | | Leave duration (in days) |
| `reason` | `String` | No | | Submission notes |
| `status` | `Enum` | No | `DRAFT` | Status (`DRAFT`, `SUBMITTED`, `APPROVED`, etc.) |
| `approvedBy` | `String` | Yes | FK | Reference to `User(id)` |
| `approvalDate` | `DateTime` | Yes | | Approval timestamp |
| `approvalNotes` | `String` | Yes | | Approver feedback notes |

### `AuditLog`
Tracks operations for system transparency.
| Field | Type | Nullable | Key/Default | Description / Relationships |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | No | PK / `cuid()` | Unique ID |
| `actionType` | `Enum` | No | | Type (`CREATE`, `UPDATE`, `DELETE`, `APPROVE` etc.) |
| `userId` | `String` | No | FK | Actor `User(id)` |
| `employeeId` | `String` | Yes | FK | Affected employee |
| `leaveRequestId` | `String` | Yes | FK | Associated leave request |
| `adjustmentId` | `String` | Yes | FK | Associated adjustment |
| `description` | `String` | No | | Readable explanation of action |
| `changes` | `String` | Yes | | Hashed JSON string of differences |
| `ipAddress` | `String` | Yes | | Actor IP |
| `userAgent` | `String` | Yes | | Actor User Agent |

---

## 7. Project Folder Structure

```
/
├── app/
│   ├── api/v1/
│   │   ├── employees/              # GET, POST, PUT, DELETE operations
│   │   ├── departments/            # Department configurations
│   │   ├── leave-types/            # Leave configurations
│   │   ├── users/                  # User access routes
│   │   ├── adjustments/            # Manual corrections API
│   │   ├── balances/               # Employee balance reports
│   │   ├── audit-logs/             # Audit logs API
│   │   ├── settings/               # System settings configurations
│   │   ├── holidays/               # Rule calculations & exceptions
│   │   └── cron/
│   │       └── accrue/             # Accrual engine webhook trigger
│   ├── (pages)/
│   │   ├── dashboard/              # Dashboards gated by role
│   │   ├── employees/              # Employee list view
│   │   ├── departments/            # Department management page
│   │   ├── leave-types/            # Settings for leaves
│   │   ├── requests/               # Employee submissions
│   │   ├── approvals/              # Manager review board
│   │   ├── reports/                # Balance summaries & charts
│   │   ├── settings/               # Unified administrative hub
│   │   ├── admin/user-access/      # Dynamic permission matrix UI
│   │   ├── login/                  # Client authentication view
│   │   └── unauthorized/           # Unauthorized gateway layout
│   ├── layout.tsx                  # Root structural layouts
│   ├── globals.css                 # Base designs & Tailwind styling
│   └── page.tsx                    # Landing router redirect
├── components/
│   ├── layout/                     # Header, navigation, and sidebar components
│   ├── auth/                       # Protected component wrappers
│   ├── ui/                         # shadcn primitive layouts
│   └── providers.tsx               # Context and Query Providers
├── lib/
│   ├── holiday-engine.ts           # Dynamic Holiday calendar calculation logic
│   ├── accrual-engine.ts           # Periodic Balance Accrual math rules
│   ├── db.ts                       # Custom Prisma Client configuration
│   ├── prisma.ts                   # Export wrappers
│   └── auth-utils.ts               # API permission validation helper
├── prisma/
│   ├── schema.prisma               # Relational Database design specifications
│   ├── seed.ts                     # Initializing Mock Data
│   └── migrations/                 # Migration schema history
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

---

## 8. Local Setup & Installation Guide

### Prerequisites
- **Node.js**: Version 18+ (20+ recommended)
- **Package Manager**: `pnpm` or `npm`
- **Database**: PostgreSQL Instance

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd leave-balance-system
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env.local` (or `.env`) file in the root directory:
   ```bash
   cp .env.example .env.local
   ```
   Add your PostgreSQL connection string and local server configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/leave_balance_db?schema=public"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   CRON_SECRET="your-development-cron-secret"
   ```

4. **Initialize the Database Schema & Seed Data**
   Apply migrations to generate database tables:
   ```bash
   pnpm db:push
   ```
   Load mock data containing initial employees, classifications, and system configurations:
   ```bash
   pnpm db:seed
   ```

5. **Start the Development Server**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000` to interact with the application.

### Demo Login Credentials

The system seeds the following demo profiles for local testing:

| Email | Password | Role | Department / Designation |
| :--- | :--- | :--- | :--- |
| `admin@example.com` | `admin` | Admin | System Administrator |
| `manager@example.com` | `manager` | Manager | HR Manager |
| `emp1@example.com` | `password` | Employee | Sales Representative |
| `emp2@example.com` | `password` | Employee | IT Support Specialist |
| `emp3@example.com` | `password` | Employee | Financial Analyst |

*Note: Demo authentication is currently localStorage-backed and matches email credentials for local mock validation.*

---

## 9. API Documentation

Endpoints are scoped under the `/api/v1` namespace and expect/return JSON payloads.

### Employee Management (`/api/v1/employees`)
- `GET /api/v1/employees` - Paginated and searchable list of employees.
- `POST /api/v1/employees` - Register a new employee user profile.
- `GET /api/v1/employees/[id]` - Details for a specific employee.
- `PUT /api/v1/employees/[id]` - Update employee and classification information.
- `DELETE /api/v1/employees/[id]` - Deactivate employee (soft-delete).

### Departments (`/api/v1/departments`)
- `GET /api/v1/departments` - List active departments.
- `POST /api/v1/departments` - Register a new department.
- `PUT /api/v1/departments/[id]` - Modify name and description.
- `DELETE /api/v1/departments/[id]` - Deactivate department (gated if employees are linked).

### Leave Configuration (`/api/v1/leave-types`)
- `GET /api/v1/leave-types` - Get active leave policies.
- `POST /api/v1/leave-types` - Create new leave rules.
- `PUT /api/v1/leave-types/[id]` - Modify rules (max days, carryover).

### Access Management (`/api/v1/users`)
- `GET /api/v1/users` - List all system user account roles.
- `PUT /api/v1/users/[id]/role` - Reassign user roles (Admin only).
- `GET /api/v1/users/[id]/history` - View historical audit trail of role assignments.

### Balances & Adjustments
- `GET /api/v1/balances` - Retrieve balance records.
- `POST /api/v1/adjustments` - Post manual balance addition/deduction.
- `GET /api/v1/audit-logs` - Query compliance audit events list.

---

## 10. Security & Best Practices Summary

- **Access Gating (RBAC)**: All API routes perform validation checks against permissions configured on the user's `Role`. Pages and layout visual elements are similarly guarded on the client.
- **SQL Injection Prevention**: Queries are processed using Prisma ORM which automatically parameterizes all inputs to prevent injection vulnerabilities.
- **Payload Sanitization & Type Checks**: Inbound API requests are validated with strict Zod schemas, returning descriptive `400 Bad Request` payloads if values deviate from requirements.
- **Audit Trails**: Non-destructive data policies (soft deletes) with before/after state captures saved as JSON strings.
- **OTP Brute-Force Rate Limiting**: The system integrates rate-limiting logic on critical paths (like the Forgot Password flow) restricting abusers to a maximum of 5 requests per 15 minutes.
- **Transactional Consistency**: Multi-table updates (e.g. deducting balances when a leave request is marked as `APPROVED`) are processed inside Prisma database transactions to guarantee atomic execution.

---

## 11. Collaborator & Developer Guide

Developers making changes are requested to review [COLLABORATOR_GUIDE.md](file:///C:/Users/lordv/Desktop/Leave-Balance-System/COLLABORATOR_GUIDE.md) for full context regarding:
- Git flow procedures and commit conventions.
- React Server Components vs Client Components.
- Step-by-step guides to introducing new database-backed elements.
- Clean code styling.

---

## 12. Troubleshooting

### Node Modules Corruption
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Prisma Client Out-of-Sync Errors
```bash
npx prisma generate
```

### Database Seed Reset
```bash
pnpm db:reset # Warning: deletes existing rows
pnpm db:seed
```

---

## 13. License & Ownership

**© 2026 Lord Aeremist P. Valdemoro, Kyle M. Valdez**

This project was developed for the **University of Perpetual Help System - Manila**.

**All Rights Reserved.**

This software is proprietary and confidential. Unauthorized copying, distribution, modification, public display, or performance of this software via any medium is strictly prohibited. All intellectual contributions and authorship remain with the developers.

---

**Last Updated:** May 25, 2026  
**Version:** 1.2.0  
