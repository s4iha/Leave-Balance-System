# Documentation Index
## Leave Balance System — Faculty Leave Management

Last updated: 2026-04-17  
Project type: Internal HR system (role-based leave management)

## Purpose
This directory is the source of truth for the Leave Balance System’s scope, domain model, architecture, security, testing, and deployment guidance.  
All feature work should reference these docs before implementation.

## Core Documents (Ordered)
1. `01-product-scope.md`  
   Goals, users, key workflows, and explicit unknowns.

2. `02-domain-model.md`  
   Canonical data entities and relationships (Prisma-aligned).

3. `03-system-architecture.md`  
   Component responsibilities and data flow (UI → API → DB).

4. `08-security-compliance.md`  
   Access control, audit logging, data handling, and environment rules.

5. `09-testing-strategy.md`  
   Manual and automated testing guidance for this repo.

6. `10-deployment-observability.md`  
   Environments, build/deploy, and logging/monitoring notes.

## Process Documents
- `backlog.md` — prioritized tasks and status notes.

## Execution Rules
- Follow `WORKFLOW.md` for PRAR lifecycle.
- Follow `.github/copilot-instructions.md` for AI-agent constraints.

## Omitted Legacy Docs (Removed)
These were recruiting/Typebot/Hirebase-specific and are not relevant to the Leave Balance System:
- `04-data-pipeline.md`
- `06-api-contracts-draft.md`
- `07-desktop-first-ui-ux.md`
- `11-external-provider-integration.md`
- `12-typebot-payload-analysis.md`
- `13-rls-roadmap.md`
- `14-environment-security.md`
- `ARCHITECTURE_DEMO.md`
- `agent-task-answer-input-modes.md`
- `copilot-instructions_hirebase.md`
