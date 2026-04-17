# Collaborator Guide (UI-Only)

This guide is for UI work only. It keeps the setup simple and explains where to change styles. It assumes you are familiar with XAMPP and vanilla PHP, so short analogies are included.

## Quick Summary
- You will **not** touch the API or database.
- You will edit **pages and components** to change UI and styling.
- The UI uses **Tailwind CSS** (utility classes in `className`).

---

## 1. What You Need (First-Time Setup)

### Required Tools
1. **Git** (to clone and pull updates)
2. **Node.js LTS** (this replaces Apache/PHP runtime)
3. **pnpm** (package manager, like Composer but for JS)

### Install Steps (Windows)
1. Install **Git**: https://git-scm.com/downloads  
2. Install **Node.js LTS**: https://nodejs.org  
3. Install **pnpm**:
   ```bash
   npm install -g pnpm
   ```

---

## 2. Clone the Project

```bash
git clone https://github.com/s4iha/Leave-Balance-System.git
cd Leave-Balance-System
```

Think of this like downloading a full project folder from GitHub, plus its history.

---

## 3. Install Dependencies

```bash
pnpm install
```

This is similar to installing all required libraries in one step (like setting up a PHP project with vendor files).

---

## 4. Run the UI Locally

```bash
pnpm dev
```

Open your browser at:  
`http://localhost:3000`

This starts the development server (like starting Apache), but it uses Node.js instead of XAMPP.

---

## 5. Where to Change UI (Most Important Section)

### A. Page UI (Main Screens)
Pages live here:
```
app/**/page.tsx
```
Examples:
- `app/(pages)/dashboard/page.tsx`
- `app/(pages)/employees/page.tsx`

These files are like your PHP pages. Edit JSX + Tailwind classes inside them.

---

### B. Shared UI Components
Reusable UI components:
```
components/
components/ui/
components/layout/
```

Examples:
- `components/layout/sidebar.tsx` (sidebar design)
- `components/ui/button.tsx` (buttons used across the app)

If you want a global change (all buttons, cards, inputs), edit these.

---

### C. Global Styles and Theme Colors
Main global styling + theme tokens:
```
app/globals.css
```

This file defines CSS variables used by Tailwind:
```css
:root {
  --primary: oklch(0.55 0.25 265);
  --background: oklch(0.95 0 0);
  --radius: 0.625rem;
}
```

Change these to update the overall theme (colors, radius, light/dark mode).

---

### D. Tailwind Classes (How Styling Works)
Tailwind uses classes like:
```tsx
<div className="p-4 bg-background text-foreground rounded-lg">
```

Common classes:
- Spacing: `p-4`, `mt-2`, `gap-4`
- Colors: `bg-primary`, `text-muted-foreground`
- Layout: `flex`, `grid`, `items-center`, `justify-between`

Tailwind docs (very useful): https://tailwindcss.com/docs

---

## 6. UI-Only Workflow (Safe Editing)

### Files You SHOULD Edit
- `app/**/page.tsx` (screen layout + Tailwind)
- `components/**` (shared UI parts)
- `app/globals.css` (theme tokens)

### Files You SHOULD NOT Edit (For UI-Only Task)
- `app/api/**` (API routes)
- `prisma/**` (database)
- `lib/db.ts` (database client)

If you accidentally touch backend files, just undo the change before committing.

---

## 7. Common Tasks You Might Do

### Change Button Color Everywhere
- Update `components/ui/button.tsx`
- Update `app/globals.css` (change `--primary`)

### Update Sidebar Spacing
- Update `components/layout/sidebar.tsx`

### Adjust Page Layout
- Update `app/(pages)/.../page.tsx`

---

## 8. Troubleshooting (UI Focus)

### Tailwind Class Not Working
- Make sure class names are plain strings.
```tsx
// Good
<div className="p-4 bg-primary" />
```

### Page Not Updating
- Stop and restart the dev server:
```bash
pnpm dev
```

### Port 3000 Already in Use (Windows)
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Or use a different port:
```bash
pnpm dev -- -p 3001
```

---

## 9. Basic Git Workflow (Minimal)

```bash
git checkout main
git pull origin main
git checkout -b ui/your-branch-name
```

After changes:
```bash
git status
git add .
git commit -m "style: update dashboard spacing"
git push origin ui/your-branch-name
```

---

## 10. Getting Help

- Next.js (UI framework): https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Shadcn/UI: https://ui.shadcn.com

If anything is unclear, ask the team. It is normal to ask questions when switching stacks.
