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
8. [Collaborator Guide - Next.js + TypeScript Fundamentals](#collaborator-guide---nextjs--typescript-fundamentals)
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

## Collaborator Guide - Next.js + TypeScript Fundamentals

### Understanding Next.js Basics

**What is Next.js?**
Next.js is a React framework that adds structure and optimization. Instead of traditional SPA (Single Page App) development, Next.js uses file-based routing.

#### File-Based Routing
- Files in `app/` directory automatically become routes
- `app/dashboard/page.tsx` → `/dashboard`
- `app/admin/user-access/page.tsx` → `/admin/user-access`
- `app/api/v1/employees/route.ts` → API endpoint at `/api/v1/employees`

**Example:**
```
File: app/employees/page.tsx
URL:  http://localhost:3000/employees
```

### Understanding TypeScript

**What is TypeScript?**
TypeScript adds types to JavaScript. It's like a spell-checker for code - it catches errors before they happen.

#### Basic Types
```typescript
// Strings
const name: string = "John";

// Numbers
const age: number = 25;

// Booleans
const isActive: boolean = true;

// Arrays
const skills: string[] = ["React", "Node"];
const scores: Array<number> = [80, 90];

// Objects
interface User {
  id: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

const user: User = {
  id: "123",
  name: "John",
  role: "ADMIN"
};
```

#### Unions & Enums
```typescript
// Union - can be multiple types
type Status = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

// Enum - named constants
enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE"
}
```

### Project Architecture Patterns

#### 1. Page Components (UI Layer)
Located in `app/**pages.tsx`, these handle UI rendering.

```typescript
'use client'; // Client component (uses state, events)

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';

export default function EmployeesPage() {
  const { user } = useAuth(); // Get current user
  const [searchTerm, setSearchTerm] = useState('');
  
  // RLS: Filter data based on role
  const visibleEmployees = user?.role === 'EMPLOYEE' 
    ? employees.filter(e => e.id === user.id)
    : employees;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          {/* Page content */}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

**Key Points:**
- `'use client'` marks component as client-side (uses hooks)
- `ProtectedRoute` enforces role-based access
- `useAuth()` gets current user context

#### 2. API Routes (Backend Layer)
Located in `app/api/v1/`, these handle database operations.

```typescript
// GET /api/v1/employees
export async function GET(request: Request) {
  try {
    // Get query params
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';

    // Fetch from database
    const employees = await prisma.employee.findMany({
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: { user: true }
    });

    return Response.json({
      success: true,
      data: employees,
      message: 'Employees retrieved'
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch' },
      { status: 500 }
    );
  }
}

// POST /api/v1/employees (Create)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate data
    if (!body.email || !body.name) {
      return Response.json(
        { success: false, error: 'Missing fields' },
        { status: 400 }
      );
    }

    // Create in database
    const employee = await prisma.employee.create({
      data: {
        user: { create: { email: body.email, name: body.name } },
        department: body.department,
        designation: body.designation
      }
    });

    return Response.json(
      { success: true, data: employee },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### 3. Hooks & Context (State Management)
Located in `lib/`, these manage application state.

```typescript
// lib/auth-context.tsx
'use client';

import { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

const AuthContext = createContext<{
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}>({
  user: null,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string) => {
    const mockUser = DEMO_USERS.find(u => u.email === email);
    setUser(mockUser || null);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Usage in components:**
```typescript
const { user, logout } = useAuth();
```

### Data Flow Example: Creating an Employee

1. **User fills form** → Component state
2. **Submit button clicked** → Calls API
3. **API route receives request** → Validates data
4. **Prisma creates in database** → Database updated
5. **Response sent back** → Component updates UI with toast

```typescript
// Page Component
async function handleAddEmployee(formData) {
  const response = await fetch('/api/v1/employees', {
    method: 'POST',
    body: JSON.stringify(formData)
  });

  const result = await response.json();
  
  if (result.success) {
    toast({ title: 'Success', description: 'Employee added' });
    // Refresh data
  } else {
    toast({ title: 'Error', description: result.error });
  }
}
```

### Common Patterns in This Project

#### Role-Based Access Control (RBAC)
```typescript
// Check before rendering
if (user?.role !== 'ADMIN') {
  return <Redirect to="/unauthorized" />;
}

// API validation
export async function POST(request: Request) {
  const user = getCurrentUser(); // From context
  if (user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
```

#### Row-Level Security (RLS) Filtering
```typescript
// Employees only see their own requests
const userRequests = user?.role === 'EMPLOYEE' 
  ? requests.filter(r => r.employee === user.name)
  : requests;
```

#### Audit Logging
```typescript
// Every action creates audit log entry
await prisma.auditLog.create({
  data: {
    actionType: 'UPDATE',
    userId: currentUser.id,
    description: `Changed role from ${oldRole} to ${newRole}`,
    changes: JSON.stringify({ oldRole, newRole })
  }
});
```

#### Form Validation with Zod
```typescript
import { z } from 'zod';

const EmployeeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  department: z.string(),
  accrualScheme: z.enum(['MONTHLY', 'SEMESTER', 'ANNUAL'])
});

// In API
const validation = EmployeeSchema.safeParse(body);
if (!validation.success) {
  return Response.json({ error: validation.error }, { status: 400 });
}
```

### Making Changes to the Project

#### Adding a New Page

1. **Create the file structure**
```bash
mkdir -p app/new-feature
touch app/new-feature/page.tsx
```

2. **Write the page component**
```typescript
'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';

export default function NewFeaturePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1>New Feature</h1>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

3. **Navigation link automatically appears** (if role matches in sidebar.tsx)

#### Adding a New API Endpoint

1. **Create route file**
```bash
mkdir -p app/api/v1/new-resource
touch app/api/v1/new-resource/route.ts
```

2. **Implement handlers**
```typescript
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const items = await prisma.newResource.findMany();
  return Response.json({ success: true, data: items });
}

export async function POST(request: Request) {
  const body = await request.json();
  const item = await prisma.newResource.create({ data: body });
  return Response.json({ success: true, data: item }, { status: 201 });
}
```

#### Modifying Database Schema

1. **Edit `prisma/schema.prisma`**
```prisma
model NewResource {
  id    String @id @default(cuid())
  name  String
  createdAt DateTime @default(now())
}
```

2. **Create and run migration**
```bash
pnpm db:migrate
```

3. **Update types in TypeScript** (automatically updated by Prisma)

### Debugging Tips

#### Using Console.log
```typescript
console.log('[v0] Component mounted with user:', user);
console.log('[v0] API response:', response.json());
```

#### VS Code Debugging
1. Install "Debugger for Chrome" extension
2. Add breakpoint by clicking line number
3. Run `pnpm dev`
4. Press F5 to start debugging

#### Check Network Requests
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click on API request to see request/response

#### Prisma Studio
```bash
pnpm db:studio
```
Opens visual database explorer at http://localhost:5555

### Common Issues & Solutions

**Q: "Cannot find module" error**
A: Check import paths. Use `@/` prefix for imports from root.
```typescript
import { useAuth } from '@/lib/auth-context'; // Correct
import { useAuth } from '../../../lib/auth-context'; // Avoid
```

**Q: Component not updating after API call**
A: Ensure you're using `useState` or refetching data after mutation.
```typescript
const [data, setData] = useState([]);

async function handleCreate(newItem) {
  await fetch('/api/v1/items', { method: 'POST', body: JSON.stringify(newItem) });
  // Refresh data
  const response = await fetch('/api/v1/items');
  setData(await response.json());
}
```

**Q: Styling not applying**
A: Ensure Tailwind class names are static strings (not dynamic).
```typescript
const className = `p-4 ${condition ? 'bg-red' : 'bg-blue'}`; // ✓ OK
const classes = ['p-4', condition ? 'bg-red' : 'bg-blue']; // ✗ Won't work
```

**Q: Database connection error**
A: Check `.env.local` DATABASE_URL setting and run `pnpm db:push`

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
