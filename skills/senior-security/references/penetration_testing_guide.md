---
name: "penetration_testing_guide"
description: "Penetration testing guide focused on Leave Balance System API and role-based workflow abuse cases."
author: "Leave Balance System"
version: "1.0.0"
category: "references"
---

# Penetration Testing Guide (LBS)

## Target Surface
- API endpoints under `app/api/v1/**/route.ts`
- Role-bound operations for Admin/Manager/Employee
- Mutation flows that impact balances, approvals, and adjustments

## Priority Test Cases

### Authorization bypass
- Employee attempts manager/admin actions.
- Manager attempts admin-only configuration changes.
- Unauthorized direct API calls bypassing UI protections.

### Input and state abuse
- Invalid date ranges and negative duration attempts in leave requests.
- Forced status transitions outside allowed workflow.
- Adjustment payload tampering to inflate balances.

### Data exposure
- Access to other employees' balances/requests.
- Overly verbose error payloads exposing internal details.
- Leakage of sensitive values in logs or responses.

## Evidence to Capture
- HTTP request/response pair with status code and payload.
- Expected vs actual authorization behavior.
- Whether audit logs are created for mutation attempts.

## Remediation Priorities
1. Broken authorization and access control
2. Inconsistent workflow state enforcement
3. Input validation gaps
4. Information disclosure

## Source of Truth
- `docs/08-security-compliance.md`
- `docs/02-domain-model.md`
- `app/api/v1/**/route.ts`
