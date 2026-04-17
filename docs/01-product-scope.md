# 01 - Product Scope
Last updated: 2026-04-17

## 1) Purpose
Define the product boundaries, core users, and explicit unknowns for the Faculty Leave System.

---

## 2) Product Summary
The Leave Balance System is an internal HR application for managing faculty leave balances, requests, approvals, and audit trails. It supports role‑based access, configurable leave types, and accrual schemes.

---

## 3) Core Users
1. **Admin** — manages employees, leave types, departments, settings, and adjustments.
2. **Manager** — approves/rejects requests and views team balances.
3. **Employee** — submits leave requests and views personal balances/history.

---

## 4) Core Workflows
- Manage employees, departments, and leave types.
- Submit and approve/reject leave requests.
- Track leave balances and accrual schemes.
- Record balance adjustments and audit logs.

---

## 5) Out of Scope (Current)
- Payroll integration
- External HRIS sync
- Multi‑tenant support
- Automated accrual scheduling beyond configured scheme logic

---

## 6) Explicit Unknowns
- Final policy rules for carryover and expiry (per department or global).
- Approval delegation rules (acting managers, proxies).
- Production authentication/SSO requirements.
