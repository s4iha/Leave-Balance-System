# 08 - Security & Compliance
Last updated: 2026-04-17

## Access Control
- Role-based access: Admin, Manager, Employee.
- UI enforcement via `ProtectedRoute` and API enforcement by role checks per route.

## Data Protection
- Avoid logging sensitive personal data.
- Use `AuditLog` to capture change metadata and the acting user.

## Environment & Secrets
- Store secrets in `.env.local` (never commit).
- Prisma `DATABASE_URL` controls the target database.

## Compliance Notes
- Maintain audit trails for employee records, leave requests, and adjustments.
- Retain historical request/adjustment data even if employees are deactivated.
