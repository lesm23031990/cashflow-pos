---
name: spec-driven-dev
description: Spec-Driven Development workflow for Cashflow POS. Use when writing specs, implementing from specs, or refining requirements.
---

## What is SDD

Spec-Driven Development means writing a formal specification FIRST before writing any code. The spec is the source of truth.

## Workflow

1. Read the spec from Plane.so issue or local `docs/specs/` file
2. Refine the spec with clarifying questions if needed
3. Write tests that validate the spec (backend: Vitest, frontend: Vitest)
4. Implement until all tests pass
5. Verify implementation matches spec
6. Mark complete

## Spec Template

Every spec must include:

```markdown
## Endpoint / Feature
**Method:** GET | POST | PUT | DELETE
**Path:** /api/...

## Request
- Headers, body, params expected

## Response
- Status codes, response shape

## Behavior
- Business rules, edge cases

## Acceptance Criteria
- [ ] Checklist of verifiable items
```

## Rules

- Never implement without a spec
- Never modify the spec without updating the acceptance criteria
- If requirements change, update the spec first
