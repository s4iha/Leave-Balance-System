# Collaborator Guide

Welcome to the Leave Balance Tracking System development team! This guide is designed for developers who may not be familiar with Next.js, TypeScript, or Git. Don't worry—we'll walk you through everything step by step.

---

## Table of Contents

1. [Getting Started with Git](#getting-started-with-git)
2. [Understanding Next.js Basics](#understanding-nextjs-basics)
3. [Understanding TypeScript](#understanding-typescript)
4. [Project Architecture Patterns](#project-architecture-patterns)
5. [Making Changes to the Project](#making-changes-to-the-project)
6. [Debugging Tips](#debugging-tips)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Getting Started with Git

Git is a version control system that helps teams collaborate. Think of it as a "save system" for code that tracks all changes.

### What is Git?
- Tracks changes to files over time
- Allows multiple people to work on the same project
- Creates a history of who changed what and when

### Common Git Terms

| Term | Meaning |
|------|---------|
| Repository (Repo) | Folder containing your project with version history |
| Clone | Download a copy of a remote repository to your computer |
| Commit | Save a set of changes with a description |
| Push | Send your commits to the remote server |
| Pull | Download latest changes from the remote server |
| Branch | Separate version of code to work on features independently |
| Merge | Combine changes from one branch into another |

### Basic Git Workflow

#### 1. Cloning the Repository (First Time Only)

Instead of downloading files manually, Git clones the entire repository:

```bash
# Navigate to where you want the project
cd ~/projects

# Clone the repository
git clone https://github.com/s4iha/Leave-Balance-System.git
cd Leave-Balance-System
```

This downloads the entire project with all history.

#### 2. Starting Your Work

Before making changes, create a new branch so your changes don't affect the main code:

```bash
# See what branch you're on
git branch

# Switch to main and update it
git checkout main
git pull origin main

# Create a new branch for your feature
git checkout -b feature/your-feature-name
```

**Branch naming convention:**
- `feature/add-dashboard` - New feature
- `fix/sidebar-layout` - Bug fix
- `docs/update-readme` - Documentation

#### 3. Making Changes

Make your code changes as usual. Then check what changed:

```bash
# See all modified files
git status

# See differences in a specific file
git diff app/employees/page.tsx
```

#### 4. Saving Your Changes (Committing)

Committing is like taking a snapshot of your changes:

```bash
# Stage all changes
git add .

# Or stage specific files
git add app/employees/page.tsx

# Create a commit with a message
git commit -m "feat: Add employee search functionality"
```

**Good commit messages:**
- Describe WHAT changed and WHY
- Start with: feat, fix, docs, refactor, style, test
- Keep it under 72 characters
- Examples:
  - ✓ `feat: Add department CRUD operations`
  - ✓ `fix: Correct sidebar overflow on mobile`
  - ✗ `updated stuff`
  - ✗ `fixed bug`

#### 5. Pushing Your Changes

Upload your commits to the server:

```bash
# Push your branch
git push origin feature/your-feature-name
```

#### 6. Creating a Pull Request (PR)

A PR asks the team to review your changes before merging:

1. Go to GitHub: https://github.com/s4iha/Leave-Balance-System
2. Click "Compare & pull request"
3. Add title and description of your changes
4. Click "Create pull request"
5. Wait for code review
6. After approval, click "Merge pull request"

#### 7. Updating Your Local Code

After changes are merged or when others make changes:

```bash
# Switch to main branch
git checkout main

# Download latest changes
git pull origin main

# Create a new branch for next feature
git checkout -b feature/next-feature
```

### Useful Git Commands

```bash
# See recent commits
git log --oneline

# See commits in your current branch
git log origin/main..HEAD

# Undo uncommitted changes in a file
git checkout -- app/employees/page.tsx

# Undo last commit (keeps changes)
git reset --soft HEAD~1

# See what will be committed
git diff --staged

# Abort a merge (if something goes wrong)
git merge --abort

# Switch to a different branch
git checkout main
git checkout feature/previous-work

# Delete a local branch
git branch -d feature/old-feature
```

### When Things Go Wrong

**"I made changes but haven't committed. How do I see them?"**
```bash
git status          # See modified files
git diff            # See exact changes
```

**"I committed to the wrong branch!"**
```bash
# Copy your commits to correct branch
git cherry-pick <commit-id>

# See commit IDs
git log --oneline
```

**"Someone else changed the same file as me"**
This is a merge conflict. GitHub or your editor will show the conflict. Edit the file to keep the changes you want, then:
```bash
git add .
git commit -m "fix: Resolved merge conflict"
git push origin your-branch
```

**"I want to undo my last commit"**
```bash
git reset --soft HEAD~1  # Keeps changes
git reset --hard HEAD~1  # Removes changes completely
```

---

## Understanding Next.js Basics

### What is Next.js?

Next.js is a React framework that adds structure and optimization. Instead of building a traditional Single Page App (SPA), Next.js uses **file-based routing**.

### File-Based Routing

Instead of manually configuring routes, the folder structure automatically becomes your routes:

```
File: app/employees/page.tsx
URL:  http://localhost:3000/employees

File: app/admin/user-access/page.tsx
URL:  http://localhost:3000/admin/user-access

File: app/api/v1/employees/route.ts
API:  POST/GET http://localhost:3000/api/v1/employees
```

**Key Files:**
- `page.tsx` - Displays a page
- `layout.tsx` - Wraps multiple pages with shared layout
- `route.ts` - API endpoint

### Page vs API Routes

**Page Route** (`app/dashboard/page.tsx`):
```typescript
'use client'; // Client component = uses state, onClick, etc.

export default function DashboardPage() {
  return <h1>Dashboard</h1>;
}
```

**API Route** (`app/api/v1/employees/route.ts`):
```typescript
// No 'use client' = runs on server only

export async function GET(request: Request) {
  const employees = await database.getEmployees();
  return Response.json({ data: employees });
}
```

### Client vs Server Components

**Client Component** (`'use client'` at top):
- Can use hooks (useState, useEffect)
- Can use browser APIs (localStorage, window)
- Runs in the browser
- Slower for initial load but interactive

```typescript
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Server Component** (default, no 'use client'):
- Cannot use hooks
- Can directly access database
- Runs on the server
- Faster initial load
- Better for security (API keys don't expose to browser)

```typescript
export default async function UsersList() {
  const users = await database.getUsers(); // Only works on server
  
  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}
```

---

## Understanding TypeScript

### What is TypeScript?

TypeScript adds "types" to JavaScript. It's like a spell-checker for code—it catches errors before they happen at runtime.

**Without TypeScript (JavaScript):**
```javascript
function greet(person) {
  return "Hello " + person.name; // Runtime error if person is null
}

greet("John"); // Crashes! "John" has no .name property
```

**With TypeScript:**
```typescript
interface Person {
  name: string;
  age: number;
}

function greet(person: Person) {
  return "Hello " + person.name; // Error caught before runtime!
}

greet("John"); // TypeScript error: string is not Person
```

### Basic Types

```typescript
// Strings
const name: string = "John";
const greeting = `Hello ${name}`; // Template literals

// Numbers (integers and floats)
const age: number = 25;
const salary: number = 50000.50;

// Booleans
const isActive: boolean = true;
const isAdmin: boolean = false;

// Arrays
const skills: string[] = ["React", "Node"];
const scores: Array<number> = [80, 90, 85];

// Any (avoid if possible - defeats purpose of TypeScript)
const anything: any = "could be anything";
```

### Objects & Interfaces

**Interface** - describes the shape of an object:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age?: number; // Optional (? means might not exist)
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

const user: User = {
  id: "123",
  name: "John",
  email: "john@example.com",
  role: "ADMIN"
  // age is optional, so it's OK to leave it out
};
```

### Unions & Literals

```typescript
// Union - can be multiple types
type Status = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

const requestStatus: Status = "APPROVED"; // OK
const badStatus: Status = "PENDING"; // ERROR!

// Function parameter can be multiple types
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value * 2;
}
```

### Generics

Generics are like templates that work with any type:

```typescript
// Generic array type
const numbers: Array<number> = [1, 2, 3];
const strings: Array<string> = ["a", "b"];

// Generic function
function getFirst<T>(items: T[]): T {
  return items[0];
}

const firstNumber = getFirst([1, 2, 3]); // T is number
const firstName = getFirst(["a", "b"]); // T is string
```

### Common Errors & Fixes

**Error: "Type 'string' is not assignable to type 'number'"**
```typescript
// Wrong
const age: number = "25"; // Can't assign string to number

// Right
const age: number = 25;
```

**Error: "Property 'name' does not exist on type 'User'"**
```typescript
interface User {
  id: string;
  // 'name' is missing
}

const user: User = { id: "1" };
console.log(user.name); // ERROR! name doesn't exist
```

---

## Project Architecture Patterns

### 1. Page Components (UI Layer)

Located in `app/**page.tsx`, these handle rendering UI.

```typescript
'use client'; // Enable client-side features

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Sidebar } from '@/components/layout/sidebar';

export default function EmployeesPage() {
  // Get current logged-in user
  const { user } = useAuth();
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on user role (RLS)
  const employees = user?.role === 'EMPLOYEE' 
    ? mockEmployees.filter(e => e.id === user.id)
    : mockEmployees;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-4 md:p-8">
            <h1>Employees</h1>
            {/* Page content */}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

**Key Points:**
- `'use client'` = client component (can use hooks, state)
- `useAuth()` gets current user
- `ProtectedRoute` enforces role-based access
- Filter data based on user role for security

### 2. API Routes (Backend Layer)

Located in `app/api/v1/`, these handle database operations.

```typescript
import { prisma } from '@/lib/db';

// GET /api/v1/employees
export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '10';

    // Fetch from database
    const employees = await prisma.employee.findMany({
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    // Return JSON response
    return Response.json({
      success: true,
      data: employees,
      message: 'Employees retrieved'
    });
  } catch (error) {
    // Error response
    return Response.json(
      { success: false, error: 'Failed to fetch' },
      { status: 500 }
    );
  }
}

// POST /api/v1/employees (Create new employee)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
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
      }
    });

    // Return created item
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

### 3. Context & Hooks (State Management)

Located in `lib/`, these manage application state.

```typescript
'use client';

import { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

// Create context
const AuthContext = createContext<{
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
} | null>(null);

// Provider component
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

// Hook to use context
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

---

## Making Changes to the Project

### Adding a New Page

1. **Create folder and file:**
```bash
mkdir -p app/new-feature
touch app/new-feature/page.tsx
```

2. **Write the page:**
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
            {/* Your content here */}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

3. **Add to sidebar navigation** (edit `components/layout/sidebar.tsx`):
```typescript
const navigationSections = [
  {
    category: 'HR Management',
    items: [
      {
        label: 'New Feature',
        href: '/new-feature',
        icon: YourIcon,
        roles: ['ADMIN'],
      },
      // ... other items
    ]
  }
  // ... other sections
];
```

### Adding a New API Endpoint

1. **Create route file:**
```bash
mkdir -p app/api/v1/new-resource
touch app/api/v1/new-resource/route.ts
```

2. **Implement handlers:**
```typescript
import { prisma } from '@/lib/db';

// GET /api/v1/new-resource
export async function GET(request: Request) {
  const items = await prisma.newResource.findMany();
  return Response.json({ success: true, data: items });
}

// POST /api/v1/new-resource
export async function POST(request: Request) {
  const body = await request.json();
  const item = await prisma.newResource.create({ data: body });
  return Response.json({ success: true, data: item }, { status: 201 });
}
```

3. **Create ID-specific endpoint** (`app/api/v1/new-resource/[id]/route.ts`):
```typescript
// GET /api/v1/new-resource/:id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const item = await prisma.newResource.findUnique({
    where: { id: params.id }
  });
  return Response.json({ success: true, data: item });
}

// PUT /api/v1/new-resource/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const item = await prisma.newResource.update({
    where: { id: params.id },
    data: body
  });
  return Response.json({ success: true, data: item });
}

// DELETE /api/v1/new-resource/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.newResource.delete({
    where: { id: params.id }
  });
  return Response.json({ success: true });
}
```

### Modifying the Database Schema

1. **Edit** `prisma/schema.prisma`:
```prisma
model NewResource {
  id    String @id @default(cuid())
  name  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. **Create migration:**
```bash
pnpm db:migrate
```

3. **Regenerate Prisma types:**
```bash
pnpm prisma generate
```

---

## Debugging Tips

### Using Console.log

```typescript
// Prefix with [v0] so it's easy to find
console.log('[v0] User data:', user);
console.log('[v0] API response:', response);

// Later, remove these logs before committing
```

### Check Network Requests

1. Open browser DevTools: Press `F12`
2. Go to **Network** tab
3. Make API call in your app
4. Click on the request to see details:
   - Request URL
   - Request body (what you sent)
   - Response (what server returned)
   - Status code (200 = success, 400 = error, 500 = server error)

### Prisma Studio

Visual database explorer:
```bash
pnpm db:studio
```
Opens at http://localhost:5555

### Check TypeScript Errors

```bash
# See all type errors
pnpm tsc --noEmit

# See errors in specific file
pnpm tsc --noEmit app/employees/page.tsx
```

---

## Common Issues & Solutions

### "Cannot find module" Error

**Problem:** TypeScript says a file doesn't exist

**Solution:** Use correct import paths with `@/` prefix:
```typescript
// Correct
import { useAuth } from '@/lib/auth-context';

// Wrong
import { useAuth } from '../../../lib/auth-context';
```

### Component Not Updating After API Call

**Problem:** You fetch data but it doesn't show on the page

**Solution:** Use `useState` to store and update data:
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function EmployeesList() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const response = await fetch('/api/v1/employees');
    const result = await response.json();
    setEmployees(result.data); // Update state = triggers re-render
  }

  return (
    <ul>
      {employees.map(e => <li key={e.id}>{e.name}</li>)}
    </ul>
  );
}
```

### Styling Not Applying

**Problem:** Tailwind CSS classes don't work

**Solution:** Make sure class names are static strings:
```typescript
// Right
const bgClass = condition ? 'bg-red-500' : 'bg-blue-500';
return <div className={`p-4 ${bgClass}`} />;

// Wrong
const classes = ['p-4', condition ? 'bg-red-500' : 'bg-blue-500'];
return <div className={classes.join(' ')} />; // Doesn't work
```

### Database Connection Error

**Problem:** Can't connect to database

**Solution:**
1. Check `.env.local` has `DATABASE_URL`
2. Run `pnpm db:push`
3. Check SQLite file exists: `prisma/dev.db`

### "Use 'use client'" Error

**Problem:** Getting this error on your page

**Solution:** Add `'use client'` at the very top if you use:
- `useState`, `useEffect` (hooks)
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`localStorage`, `window`)

```typescript
'use client'; // Must be first line!

import { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0); // Now this works
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Port Already in Use

**Problem:** `pnpm dev` says port 3000 is already in use

**Solution:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

---

## Key Takeaways

1. **Git** - Save and share code with the team
2. **Next.js** - Files automatically become routes
3. **TypeScript** - Catch errors before they happen
4. **Architecture** - Pages (UI) → API (backend) → Database
5. **Always test** - Check console, network tab, browser console

---

## Need Help?

- **Next.js Docs:** https://nextjs.org/docs
- **TypeScript Docs:** https://www.typescriptlang.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Git Docs:** https://git-scm.com/doc

**Good luck! Don't hesitate to ask questions—that's how we all learn.** 🚀
