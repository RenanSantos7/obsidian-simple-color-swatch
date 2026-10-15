# 06 — Docs + final verification

**Plan sections:** "Conventions", steps 8 and 9.

## Goal

Project documented and verified end-to-end.

## Checklist

- [x] `README.md` (English): what the plugin does, supported formats, recognition-rules table with examples, settings, installation (manual via release assets), development commands. Document explicitly that the plugin **never modifies notes** (swatches are decorations/rendered HTML only; only plugin settings are persisted).
- [x] `AGENTS.md`: project overview, commands (`pnpm i/dev/build/lint/test`, `node ./install.mjs`), file layout, coding conventions (from PLAN.md "Conventions"), and a pointer to `.agents/PLAN.md` as the source of truth + `.agents/tasks/` for execution tracking.
- [x] Review `manifest.json` fields one last time (id `simple-color-swatch`, name `Simple Color Swatch`, description, `minAppVersion` accurate, `isDesktopOnly: false`).
- [x] Verify `install.mjs` copies `main.js`, `manifest.json`, `styles.css` into `<vault>/.obsidian/plugins/simple-color-swatch/`.
- [x] Final gate: `pnpm build` → `pnpm lint` → `pnpm test` → `node ./install.mjs`.
- [ ] Manual verification in the test vault (with the user): Live Preview, reading mode, all four settings toggles, edge cases from the acceptance criteria of tasks 03–05.
- [ ] `.agents/PLAN.md` updated if anything diverged during implementation.

## Acceptance criteria

- [ ] New user can install and understand the plugin from the README alone.
- [ ] All acceptance criteria from tasks 03–05 verified manually in the vault.
- [ ] Docs match the actual behavior and file layout.
