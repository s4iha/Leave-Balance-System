# PRAR Prime Directive: Workflow Cycle

This project executes tasks through **PRAR**: **Perceive → Reason → Act → Refine**.  
No complex implementation proceeds without plan approval.

---

## Phase 1: Perceive & Understand
**Goal:** Build a complete and accurate model of the task and constraints.

### Actions
1. Parse explicit and implicit requirements from the latest user message.
2. Inspect current docs/code context before proposing changes.
3. Identify unknowns and external contract gaps (do not assume missing APIs).
4. Resolve ambiguity through user clarification when needed.
5. Define a testable “Definition of Done” for the requested task.

### Outputs
- concise findings
- known unknowns list
- done criteria

---

## Phase 2: Reason & Plan
**Goal:** Propose a safe, transparent implementation plan for approval.

### Actions
1. List files to create/modify.
2. Propose test strategy first (unit/integration/e2e as applicable).
3. Sequence atomic implementation steps.
4. Update `docs/backlog.md` with status/priority/dependency.
5. Request approval before making substantial changes.

### Rule
**Do not proceed to implementation without user confirmation for complex changes.**

---

## Phase 3: Act & Implement
**Goal:** Execute approved plan with deterministic, auditable changes.

### Actions
1. Implement in small atomic increments.
2. Prefer tests-first where practical.
3. Run relevant checks after edits:
   - lint
   - typecheck
   - unit/integration tests
   - security checks as available
4. Record key learnings and edge cases in `LEARNINGS.gemini.md`.

### Documentation Strategy: Use Backlog, Not Summary Files
- **Do NOT create** separate `*_COMPLETE.md`, `*_SUMMARY.md`, or change logs.
- **Instead**: Update `docs/backlog.md` with:
  - Status change: `todo` → `in_progress` → `done`
  - Completion date
  - Files modified (brief list)
  - Known issues or follow-ups (if any)
- This consolidates all change tracking in one YAML file.
- Saves tokens and prevents doc duplication.

---

## Phase 4: Refine & Reflect
**Goal:** Leave the project in a verifiably better state.

### Actions
1. Run full verification suite (as applicable).
2. Update impacted docs (`docs/*`) and backlog status.
3. Ensure commit grouping is logical and clearly named.
4. Reflect and capture durable lessons in `LEARNINGS.gemini.md`.

---

## Operational Alignment Notes
- Follow `.github/copilot-instructions.md` for AI-agent operating constraints.
- Mobile-first and progressive enhancement rules are mandatory for UI work.
- Security baseline (OWASP/ASVS intent) applies to all backend/API changes.
- Unknown external integrations (PPA/IPMS/POMS specifics) must remain explicit placeholders until official contracts are provided.
