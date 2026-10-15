# Tasks

Derived from the "Steps" in `.agents/PLAN.md`. The plan is the source of truth for design details; these files track execution. Tasks group the plan's steps into units of work (mapping in the table below).

| # | Task | Plan steps | Depends on | Status |
|---|------|-----------|------------|--------|
| 01 | [Scaffold from sample plugin](01-scaffold.md) | 1 | — | done |
| 02 | [Color detection + unit tests](02-color-detection.md) | 2 | 01 | done |
| 03 | [Live Preview swatches](03-live-preview.md) | 3, 6 | 02 | todo |
| 04 | [Reading mode swatches](04-reading-mode.md) | 4 | 02 | todo |
| 05 | [Settings tab](05-settings.md) | 5, 7 | 03, 04 | todo |
| 06 | [Docs + final verification](06-docs-verification.md) | 8, 9 | 05 | todo |

## Conventions

- Do tasks in order. One task = one unit of work; commit only when the whole task is done (conventional commit + gitmoji, e.g. `feat: :sparkles: ...`). Never push without explicit approval.
- Tick checkboxes as items are completed and update the Status column (`todo` → `in progress` → `done`).
- If a task reveals the plan is wrong, update `.agents/PLAN.md` and the affected task files in the same change.
