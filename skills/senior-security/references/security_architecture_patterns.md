---
name: "security_architecture_patterns"
description: "Security architecture patterns for Leave Balance System API, data layer, and auditability."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Security Architecture Patterns (LBS)

## Security Architecture Model
- **Presentation:** role-gated UI (`ProtectedRoute`) controls navigation and user experience.
- **Application:** API route handlers enforce authorization, validation, and workflow rules.
- **Data:** Prisma + PostgreSQL persistence with mutation audit logs.

## Core Patterns

### Defense in depth for role controls
- Keep checks in both UI and API layers.
- Assume direct API access is possible and validate server-side every time.

### Explicit trust boundaries
- Browser/client input is untrusted.
- Route handlers are the enforcement boundary.
- Database constraints and transactions are integrity boundary.

### Auditable mutation architecture
- Mutations to employees, requests, balances, and adjustments must leave an audit trail.
- Audit entries should explain business intent and changed fields.

### Least-privilege workflow separation
- Employee: submit/cancel own requests within policy.
- Manager: approve/reject team requests.
- Admin: policy, master data, and adjustment authority.

## Anti-Patterns
- Trusting localStorage role context as sole authorization source.
- Weakly typed payload handling that bypasses validation.
- Security decisions hidden in implicit defaults.

## Source of Truth
- `docs/08-security-compliance.md`
- `docs/03-system-architecture.md`
- `components/auth/protected-route.tsx`
- `app/api/v1/**/route.ts`
