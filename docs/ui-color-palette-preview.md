# UI Color Palette Preview (Stitch + Current System)

This document aligns the Stitch palette with the current Leave Balance System tokens and proposes a dark-mode variant so you can validate visual cohesion before redesign.

## Source Palette (Stitch — Light)

| Name | Hex | Intended role |
| --- | --- | --- |
| Primary | #2252A4 | Brand actions, primary CTAs |
| Secondary | #FFC63E | Highlights, warnings, emphasis |
| Tertiary | #592300 | Deep accent, supportive emphasis |
| Neutral | #F8FAFC | App background, base surfaces |

## Token Mapping (Light Mode)

Mapped to existing CSS variables from `app/globals.css` so you can compare directly.

| Token | Light value | Usage |
| --- | --- | --- |
| --background | #F8FAFC | App background |
| --foreground | #0F172A | Primary text |
| --card | #FFFFFF | Cards, panels |
| --card-foreground | #0F172A | Card text |
| --popover | #FFFFFF | Popovers, menus |
| --popover-foreground | #0F172A | Popover text |
| --primary | #2252A4 | Primary buttons, links |
| --primary-foreground | #F8FAFC | Text on primary |
| --secondary | #FFC63E | Highlights, warning chips |
| --secondary-foreground | #2B1A00 | Text on secondary |
| --accent | #FFC63E | Accent highlights |
| --accent-foreground | #2B1A00 | Text on accent |
| --muted | #F1F5F9 | Subtle surfaces, table stripes |
| --muted-foreground | #475569 | Secondary text |
| --border | #E2E8F0 | Borders, dividers |
| --input | #FFFFFF | Input background |
| --ring | #2252A4 | Focus ring |
| --destructive | #D9483A | Errors, destructive actions |
| --destructive-foreground | #F8FAFC | Text on destructive |
| --sidebar | #F8FAFC | Sidebar background |
| --sidebar-foreground | #0F172A | Sidebar text |
| --sidebar-primary | #2252A4 | Active nav, primary sidebar items |
| --sidebar-primary-foreground | #F8FAFC | Sidebar primary text |
| --sidebar-accent | #FFC63E | Sidebar accents |
| --sidebar-accent-foreground | #2B1A00 | Sidebar accent text |
| --sidebar-border | #E2E8F0 | Sidebar dividers |
| --sidebar-ring | #2252A4 | Sidebar focus ring |

## Token Mapping (Dark Mode)

Derived to preserve brand hues and contrast in dark UI.

| Token | Dark value | Usage |
| --- | --- | --- |
| --background | #0B1220 | App background |
| --foreground | #E6EDF6 | Primary text |
| --card | #121A2B | Cards, panels |
| --card-foreground | #E6EDF6 | Card text |
| --popover | #121A2B | Popovers, menus |
| --popover-foreground | #E6EDF6 | Popover text |
| --primary | #4B75D6 | Primary buttons, links |
| --primary-foreground | #F8FAFC | Text on primary |
| --secondary | #FFCF5C | Highlights, warning chips |
| --secondary-foreground | #2B1A00 | Text on secondary |
| --accent | #FFCF5C | Accent highlights |
| --accent-foreground | #2B1A00 | Text on accent |
| --muted | #1A2438 | Subtle surfaces, table stripes |
| --muted-foreground | #9AA7B2 | Secondary text |
| --border | #2A354A | Borders, dividers |
| --input | #121A2B | Input background |
| --ring | #4B75D6 | Focus ring |
| --destructive | #E25A4D | Errors, destructive actions |
| --destructive-foreground | #F8FAFC | Text on destructive |
| --sidebar | #0F172A | Sidebar background |
| --sidebar-foreground | #E6EDF6 | Sidebar text |
| --sidebar-primary | #4B75D6 | Active nav, primary sidebar items |
| --sidebar-primary-foreground | #F8FAFC | Sidebar primary text |
| --sidebar-accent | #FFCF5C | Sidebar accents |
| --sidebar-accent-foreground | #2B1A00 | Sidebar accent text |
| --sidebar-border | #2A354A | Sidebar dividers |
| --sidebar-ring | #4B75D6 | Sidebar focus ring |

## UI Usage Notes (Quick Check)

- **Primary actions** (create, submit, approve): use `--primary` with `--primary-foreground`.
- **Warning / pending status** (submitted, awaiting approval): use `--secondary` for badges and headers.
- **Destructive actions** (reject, delete): use `--destructive`.
- **Tables**: use `--muted` for row stripes and `--border` for separators.
- **Focus states**: use `--ring` for all interactive controls.

## Current System Menus (For Stitch UI Progression)

Use this menu structure exactly so the redesign mirrors the actual navigation.

| Category | Menus |
| --- | --- |
| Main | Dashboard |
| HR Management | Employees, Departments, Leave Types |
| Leave Management | My Requests, Approvals |
| Reports & Analytics | Reports |
| Administration | Settings, User Access |

## Stitch Prompt (Ready to Paste)

### The Prompt
```
You are a senior product designer creating a cohesive UI for the Leave Balance Tracking & Management System (enterprise HR app for University of Perpetual Help System - Manila). Restyle both the existing system and the proposed Stitch design using the palette and token mapping below.

Design intent:
- Professional, trustworthy, and efficient. Avoid playful aesthetics.
- Clear hierarchy for approvals, balances, and audit trails.
- Accessibility: maintain strong contrast and readable text in both light and dark modes.

Palette:
Light: Primary #2252A4, Secondary #FFC63E, Tertiary #592300, Neutral #F8FAFC
Dark (derived): Background #0B1220, Surface #121A2B, Surface-2 #1A2438, Text #E6EDF6, Text-muted #9AA7B2, Border #2A354A, Primary #4B75D6, Secondary #FFCF5C, Destructive #E25A4D

Token mapping (apply these tokens consistently):
- background: #F8FAFC / #0B1220
- foreground: #0F172A / #E6EDF6
- card: #FFFFFF / #121A2B
- muted: #F1F5F9 / #1A2438
- border: #E2E8F0 / #2A354A
- primary: #2252A4 / #4B75D6
- secondary: #FFC63E / #FFCF5C
- destructive: #D9483A / #E25A4D

Required output format:
1) Design summary (2-4 sentences)
2) Token usage by key areas (Dashboard, My Requests, Approvals, Employees, Departments, Leave Types, Reports, Settings, User Access)
3) Light/Dark mode differences
4) Navigation and UI progression using the exact menu list below
5) Accessibility checks and any conflicts with the palette

Menus to include exactly in the UI progression:
- Dashboard
- Employees
- Departments
- Leave Types
- My Requests
- Approvals
- Reports
- Settings
- User Access

Constraints:
- Do not invent additional brand colors outside the palette; only tints/shades that stay within the same hue families are allowed.
- Keep UI components consistent with enterprise HR workflows and data tables.
```

### Implementation Notes
- Uses explicit role framing to set expertise and tone.
- Specifies palette and token constraints to reduce color drift.
- Forces a structured output to make review and comparison easy.
- Adds accessibility and conflict checks for early validation.

### Usage Guidelines
- Paste the prompt into Stitch to generate or restyle the proposed UI.
- Compare Stitch output against the token tables above for deviations.
- If a color mismatch appears, adjust by staying within the same hue family.

### Example Expected Output (Short)
- Design summary mentioning a calm blue primary, high-contrast text, and clear status signaling.
- A token usage list showing primary for approvals, secondary for pending states, destructive for rejections.

### Performance Benchmarks
- Produces a palette-consistent design in one pass.
- No unnamed or off-palette colors appear in the output.
- All primary CTA states are clearly visible in both modes.

### Error Handling Strategies
- If any palette value is missing, request it explicitly before generating UI output.
- If contrast is insufficient, propose the minimal shade adjustment and note it.
