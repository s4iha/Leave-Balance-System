# 09 - Testing Strategy
Last updated: 2026-04-17

## Current State
- No automated test suite is configured in `package.json`.
- Validation relies on linting and TypeScript checks.

## Manual Verification
1. Run dev server: `pnpm dev`
2. Verify core flows for each role:
   - Admin: employee/department/leave type CRUD, adjustments, reports
   - Manager: approvals, team views
   - Employee: request submission and history
3. Validate API routes via browser or REST client.

## Future Automation (Planned)
- Add API route tests for CRUD endpoints.
- Add smoke tests for the primary role-based pages.
