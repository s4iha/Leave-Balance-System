# Color System Reference Guide

This guide helps you understand which UI components are affected by each CSS color variable in `app/globals.css`.

## Quick Reference

### How It Works
```
globals.css (CSS Variable)
    ↓
Tailwind Classes (bg-primary, text-primary, etc.)
    ↓
All Pages & Components (automatically updated)
```

When you change a variable in `app/globals.css`, every component using that color updates instantly across all 10 pages.

---

## Color Variables & Their Components

### **--primary** & **--primary-foreground**
**Purpose**: Main brand color (purple)

**Components Affected**:
- ✅ Buttons (default variant) - "Submit", "Save", "Approve", "Create" buttons
- ✅ Button links - text with underline hover
- ✅ Badge (default) - status badges with background
- ✅ Calendar - selected dates highlighting
- ✅ Checkbox - checked state (filled box)
- ✅ Radio button - selected state (filled circle)
- ✅ Progress bars - filled portion
- ✅ Switch - toggle ON state
- ✅ Slider - track and thumb
- ✅ Focus rings - outline when tabbing through form fields
- ✅ Sidebar - active menu item background & text
- ✅ Form inputs - focus outline ring color

**Where to Find Examples**:
- Dashboard: "Approve" button on leave requests
- Employees: "Add Employee" button
- Leave Types: "Create Leave Type" button

---

### **--secondary** & **--secondary-foreground**
**Purpose**: Alternative brand color (light gray)

**Components Affected**:
- ✅ Buttons (secondary variant)
- ✅ Badge (secondary variant)

**Where to Find Examples**:
- Less common in current UI; reserved for alternative actions

---

### **--muted** & **--muted-foreground**
**Purpose**: Disabled or inactive states

**Components Affected**:
- ✅ Disabled button backgrounds & text
- ✅ Disabled input field backgrounds
- ✅ Placeholder text in form fields
- ✅ Secondary/inactive labels

**Where to Find Examples**:
- Dashboard: Disabled "Approve" buttons (when you lack permission)
- Forms: Grayed-out text fields
- Tables: Inactive row styling

---

### **--accent** & **--accent-foreground**
**Purpose**: Highlights, hover states, and interactive feedback

**Components Affected**:
- ✅ Button (outline variant) - hover state background
- ✅ Button (ghost variant) - hover state background
- ✅ Skeleton loading animation - pulsing background
- ✅ Secondary interactive states
- ✅ Table row hover effects

**Where to Find Examples**:
- Employees table: Gray background on row hover
- Loading states: Pulsing skeleton cards
- Dialog buttons: Secondary button hover effect

---

### **--destructive** & **--destructive-foreground**
**Purpose**: Delete, cancel, and danger actions (red)

**Components Affected**:
- ✅ Buttons (destructive variant) - "Delete", "Cancel", "Remove" buttons
- ✅ Badge (destructive variant) - error/rejected badges
- ✅ Alert (destructive variant) - error message boxes
- ✅ Form validation error states
- ✅ Confirmation dialogs for destructive actions

**Where to Find Examples**:
- Dashboard: "Reject" button on requests (red)
- Employees: "Delete Employee" button
- Audit Logs: "Failed" status badges (red)
- Settings: "Delete Account" (if present)

---

### **--background** & **--foreground**
**Purpose**: Base page appearance

**Components Affected**:
- ✅ Main page background color
- ✅ Primary text color for all content
- ✅ Body background
- ✅ Default text color

**Where to Find Examples**:
- Every page's main content area
- All paragraph text and labels

---

### **--card** & **--card-foreground**
**Purpose**: Card containers and modal backgrounds

**Components Affected**:
- ✅ Card component background
- ✅ Dialog/Modal background
- ✅ Popover background (when expanded)
- ✅ Text inside cards

**Where to Find Examples**:
- Stat cards on dashboard
- Dialog boxes for approving/rejecting requests
- Information panels in modals

---

### **--border**
**Purpose**: All borders and dividers

**Components Affected**:
- ✅ Card borders
- ✅ Table borders & cell dividers
- ✅ Input field borders
- ✅ Dialog borders
- ✅ Horizontal dividers

**Where to Find Examples**:
- Stat cards: thin border around edge
- Table: borders between rows/columns
- Form inputs: border around text fields

---

### **--input**
**Purpose**: Form input fields background

**Components Affected**:
- ✅ Text input backgrounds
- ✅ Textarea backgrounds
- ✅ Select dropdown backgrounds
- ✅ Input field default state

**Where to Find Examples**:
- Dashboard: filter inputs
- Forms: text fields for entering data
- Requests: date/status select dropdowns

---

### **--ring**
**Purpose**: Focus indicators (accessibility)

**Components Affected**:
- ✅ Focus rings shown when tabbing (Tab key navigation)
- ✅ Outline on buttons when focused
- ✅ Input field focus rings

**Where to Find Examples**:
- Press Tab on any button - you'll see a colored ring around it
- Click an input field - blue ring around the field

---

### **--chart-1 through --chart-5**
**Purpose**: Data visualization colors

**Components Affected**:
- ✅ Chart/graph colors (if charts are added)
- ✅ Data series colors
- ✅ Report visualizations

**Where to Find Examples**:
- Reports page (when charts are implemented)

---

### **Sidebar Colors**
**Purpose**: Dedicated sidebar styling

**Components Affected**:
- `--sidebar` - Sidebar background
- `--sidebar-foreground` - Sidebar text
- `--sidebar-primary` - Active menu item background
- `--sidebar-primary-foreground` - Active menu item text
- `--sidebar-accent` - Sidebar hover state
- `--sidebar-accent-foreground` - Sidebar hover text
- `--sidebar-border` - Sidebar dividers
- `--sidebar-ring` - Sidebar focus ring

**Where to Find Examples**:
- Left navigation menu
- Active page indicator (highlighted menu item)

---

## How to Change Colors

### Step 1: Identify the Variable
Refer to the components list above to find which variable to change.

### Step 2: Edit `globals.css`
- For **light mode**: Change values in `:root {}`
- For **dark mode**: Change values in `.dark {}`

### Step 3: Update Value
Colors use **OKLCh format**: `oklch(lightness chroma hue)`
- `lightness`: 0 to 1 (0 = black, 1 = white, 0.5 = medium)
- `chroma`: 0 to 0.3+ (color intensity, 0 = grayscale)
- `hue`: 0-360 (color wheel: red=0/360, yellow=100, green=140, blue=265, purple=290)

**Example Change**:
```css
/* Change primary button color from purple to blue */
--primary: oklch(0.55 0.25 265);  /* Purple */
--primary: oklch(0.55 0.25 200);  /* Blue */
```

### Step 4: Build & Test
```bash
pnpm build
pnpm dev
```

---

## Light Mode Colors (`:root`)

| Variable | Purpose | Value |
|----------|---------|-------|
| `--background` | Page background | Light | `oklch(0.95 0 0)` |
| `--foreground` | Text color | Dark | `oklch(0.145 0 0)` |
| `--primary` | Brand color | Purple | `oklch(0.55 0.25 265)` |
| `--accent` | Hover/highlight | Cyan | `oklch(0.50 0.20 200)` |
| `--destructive` | Danger/delete | Red | `oklch(0.577 0.245 27.325)` |

---

## Dark Mode Colors (`.dark`)

| Variable | Purpose | Value |
|----------|---------|-------|
| `--background` | Page background | Very dark | `oklch(0.125 0 0)` |
| `--foreground` | Text color | Light | `oklch(0.95 0 0)` |
| `--primary` | Brand color | Purple (same) | `oklch(0.55 0.25 265)` |
| `--accent` | Hover/highlight | Cyan (same) | `oklch(0.50 0.20 200)` |
| `--destructive` | Danger/delete | Dark red | `oklch(0.396 0.141 25.723)` |

---

## Common Use Cases

### Change All Buttons to a Different Color
Change `--primary` value in both `:root {}` and `.dark {}`

### Change Hover/Interactive States
Change `--accent` value

### Change Error Messages/Delete Buttons
Change `--destructive` value

### Change Page Text
Change `--foreground` (light mode) or `--foreground` (dark mode)

### Change Input Field Styling
Change `--input` and/or `--border` values

---

## Tips

- **Light mode**: Prefer `lightness` 0.8-0.95 for backgrounds, 0.1-0.3 for text
- **Dark mode**: Prefer `lightness` 0.1-0.3 for backgrounds, 0.8-0.95 for text
- **Consistency**: Keep `--primary` the same in both light and dark modes for brand recognition
- **Accessibility**: Ensure text color contrast with background (generally target 4.5:1 ratio minimum)
- **No page edits needed**: All changes take effect immediately across all 10 pages!
