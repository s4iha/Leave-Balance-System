# University of Perpetual Help System - Manila
## Leave Balance Tracking & Management System

A comprehensive enterprise HR application for managing employee leave balances, requests, and approvals. Built with modern technologies and designed for scalability and compliance.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Database Setup](#database-setup)
7. [API Documentation](#api-documentation)
8. [Collaborator Guide](#collaborator-guide)
9. [Contributing Guidelines](#contributing-guidelines)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

The Leave Balance Tracking System is an enterprise HR solution designed for the University of Perpetual Help System - Manila to manage employee leave policies, track leave balances, process leave requests, and maintain comprehensive audit trails for compliance.

### Key Objectives
- **Centralized Leave Management**: Track leave balances across multiple accrual schemes (Monthly, Semester, Annual)
- **Approval Workflow**: Manager-based approval system with audit logging
- **Role-Based Access**: Three tiers of access (Admin, Manager, Employee)
- **Compliance & Audit Trail**: Complete tracking of all changes for compliance requirements
- **Scalable Architecture**: Built for future integration with Supabase and production deployment

---

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety and development efficiency
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/UI** - High-quality component library built on Radix UI
- **React Hook Form** - Form state management with validation (Zod)
- **Recharts** - Data visualization library
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Next-themes** - Dark mode support

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Prisma ORM** - Database abstraction and type-safe queries
- **SQLite** (Development) - Lightweight database for development
- *Ready for Supabase* - Migration path to production database

### Development Tools
- **TypeScript 5.7** - Static type checking
- **ESLint** - Code quality
- **Tailwind CSS** - Responsive design
- **Tailwind Merge** - Smart class merging
- **Date-fns** - Date manipulation

---

## Features

### User Roles & Permissions

#### Admin
- Full system access
- Employee management (CRUD)
- Leave type configuration
- User access control
- Department management
- System settings and balance adjustments
- View all reports and analytics

#### Manager
- View and manage team members
- Approve/reject leave requests
- View team reports
- Submit own leave requests

#### Employee
- View personal leave balance
- Submit leave requests
- Track request status
- View personal history

### Core Features

#### 1. Dashboard
- Role-based dashboard with personalized stats
- Quick access to pending items
- Leave balance overview
- Recent activity feed

#### 2. Leave Management
- **My Requests**: Submit, edit, and cancel leave requests
- **Approvals**: Manager interface for reviewing and approving requests
- **Request Status Tracking**: Draft, Submitted, Approved, Rejected, Cancelled

#### 3. Employee Management
- Add, edit, and deactivate employees
- Assign departments and designations
- Set accrual scheme (Monthly, Semester, Annual)
- View employee leave balances

#### 4. Leave Types
- Configure leave policies
- Set maximum days per year
- Configure carryover rules
- Enable/disable leave types

#### 5. Departments
- Create and manage departments
- Track employee count per department
- Soft delete with validation

#### 6. Reports & Analytics
- Leave balance reports by employee/department
- Accrual scheme analysis
- Leave type distribution
- Visual data representations

#### 7. User Access Management
- Assign roles to users
- View role change history
- Prevent removal of last admin
- Audit trail for all role changes

#### 8. Settings & Adjustments
- Manual balance adjustments (bonus, correction, compensation)
- System settings configuration
- Audit log viewing with filtering

---

## Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── api/v1/
│   │   ├── employees/
│   │   │   ├── route.ts (GET, POST)
│   │   │   └── [id]/route.ts (GET, PUT, DELETE)
│   │   ├── departments/
│   │   │   ├── route.ts (GET, POST)
│   │   │   └── [id]/route.ts (GET, PUT, DELETE)
│   │   ├── leave-types/
│   │   ├── users/
│   │   ├── adjustments/
│   │   ├── balances/
│   │   ├── audit-logs/
│   │   └── settings/
│   ├── (pages)/
│   │   ├── dashboard/page.tsx
│   │   ├── employees/page.tsx
│   │   ├── departments/page.tsx
│   │   ├── leave-types/page.tsx
│   │   ├── requests/page.tsx
│   │   ├── approvals/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── admin/user-access/page.tsx
│   │   ├── login/page.tsx
│   │   └── unauthorized/page.tsx
│   ├── layout.tsx (Root layout with providers)
│   ├── globals.css (Tailwind & theme configuration)
│   └── page.tsx (Redirect to dashboard/login)
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx (Main navigation with categorized menu)
│   │   └── (other layout components)
│   ├── auth/
│   │   └── protected-route.tsx (Authorization wrapper)
│   ├── ui/ (shadcn/ui components)
│   ├── providers.tsx (Context providers)
│   └── (feature components)
├── lib/
│   ├── auth-context.tsx (Mock authentication with demo users)
│   ├── db.ts (Prisma client instance)
│   └── utils.ts (Utility functions)
├── prisma/
│   ├── schema.prisma (Data model definitions)
│   ├── seed.ts (Database seeding with mock data)
│   └── migrations/ (Database version history)
├── hooks/
│   └── use-toast.ts (Toast notifications)
├── public/ (Static assets)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (v20 recommended)
- npm or pnpm package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd leave-balance-system
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Update `.env.local` with:
```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Start development server**
```bash
pnpm dev
```

Visit `http://localhost:3000` in your browser.

### Demo Login Credentials

The system includes mock authentication with demo users:

| Email | Password | Role | Department |
|-------|----------|------|-----------|
| admin@example.com | (any) | Admin | - |
| manager@example.com | (any) | Manager | HR |
| emp1@example.com | (any) | Employee | Sales |
| emp2@example.com | (any) | Employee | IT |
| emp3@example.com | (any) | Employee | Finance |

No actual password validation occurs in the demo - just click "Login" with any email.

---

## Database Setup

### Development Database

The project uses SQLite for development with Prisma ORM.

#### Push schema to database
```bash
pnpm db:push
```

#### Seed database with demo data
```bash
pnpm db:seed
```

#### Run database migrations
```bash
pnpm db:migrate
```

#### Open Prisma Studio (visual database explorer)
```bash
pnpm db:studio
```

#### Reset database (⚠️ destructive)
```bash
pnpm db:reset
```

### Database Schema Overview

**Key Tables:**
- `User` - User accounts with roles (Admin, Manager, Employee)
- `Employee` - Employee profiles with department and leave scheme
- `LeaveType` - Leave policy definitions
- `BalanceRecord` - Leave balance tracking per employee/type/year
- `LeaveRequest` - Leave request workflow
- `BalanceAdjustment` - Manual balance corrections
- `AuditLog` - Compliance audit trail
- `SystemSetting` - Configuration settings

---

## API Documentation

All API routes follow RESTful conventions under `/api/v1/` namespace.

### Authentication
Currently uses mock authentication. Each request is automatically validated based on user role from the auth context.

### Employees API
```
GET    /api/v1/employees              (List all, supports pagination & filtering)
POST   /api/v1/employees              (Create new employee)
GET    /api/v1/employees/[id]         (Get single employee)
PUT    /api/v1/employees/[id]         (Update employee)
DELETE /api/v1/employees/[id]         (Soft delete)
```

### Departments API
```
GET    /api/v1/departments            (List all departments)
POST   /api/v1/departments            (Create department)
GET    /api/v1/departments/[id]       (Get single department)
PUT    /api/v1/departments/[id]       (Update department)
DELETE /api/v1/departments/[id]       (Delete department)
```

### Leave Types API
```
GET    /api/v1/leave-types            (List all leave types)
POST   /api/v1/leave-types            (Create leave type)
GET    /api/v1/leave-types/[id]       (Get single type)
PUT    /api/v1/leave-types/[id]       (Update leave type)
DELETE /api/v1/leave-types/[id]       (Delete leave type)
```

### Users API (Access Control)
```
GET    /api/v1/users                  (List all users - Admin only)
GET    /api/v1/users/[id]             (Get user details)
PUT    /api/v1/users/[id]/role        (Change user role - Admin only)
GET    /api/v1/users/[id]/history     (View role change history)
```

### Balance & Adjustments API
```
GET    /api/v1/balances               (Get balance records)
POST   /api/v1/adjustments            (Create balance adjustment)
GET    /api/v1/audit-logs             (Get audit trail)
```

### Response Format
All successful responses return:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error description",
  "statusCode": 400
}
```

---

## Collaborator Guide

Welcome to the development team! If you're new to Next.js, TypeScript, or Git, don't worry—we have a comprehensive guide for you.

**[Read the full Collaborator Guide →](./COLLABORATOR_GUIDE.md)**

The guide covers:
- **Git Basics** - Cloning, committing, pushing, and creating pull requests (designed for non-Git users)
- **Next.js Fundamentals** - File-based routing, client vs server components
- **TypeScript Essentials** - Types, interfaces, and common patterns
- **Project Architecture** - How pages, APIs, and database operations work together
- **Making Changes** - Step-by-step guides for adding features
- **Debugging Tips** - Console logs, network inspection, Prisma Studio
- **Common Issues** - Solutions to frequent problems

---

## Contributing Guidelines

### Before Making Changes
1. Pull latest from main branch
2. Create feature branch: `git checkout -b feature/your-feature`
3. Follow the patterns established in the codebase
4. Test thoroughly before submitting PR

### Code Style
- Use TypeScript for all components
- Follow existing component patterns
- Add comments for complex logic
- Keep components small and focused

### Testing Changes
1. Run dev server: `pnpm dev`
2. Test all user roles (Admin, Manager, Employee)
3. Check mobile responsiveness
4. Test API endpoints with curl or Postman
5. Verify audit logs are created

### Commit Messages
```
feat: Add new department CRUD functionality
fix: Correct sidebar layout overflow issue
docs: Update README with setup instructions
refactor: Simplify employee filtering logic
```

---

## Troubleshooting

### Dev Server Issues

**Port already in use**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

**Node modules corrupted**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Database Issues

**Migration conflicts**
```bash
pnpm db:reset  # ⚠️ Destructive - resets database
pnpm db:seed   # Repopulate with demo data
```

**Prisma cache issues**
```bash
npx prisma generate
```

### Build Issues

**Type errors**
```bash
pnpm tsc --noEmit  # Check all type errors
```

**Build fails**
```bash
rm -rf .next
pnpm build
```

---

## Support & Questions

For detailed information:
- Next.js Docs: https://nextjs.org/docs
- TypeScript Docs: https://www.typescriptlang.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

**Last Updated:** April 16, 2026
**Version:** 1.0.0
**License:** MIT
