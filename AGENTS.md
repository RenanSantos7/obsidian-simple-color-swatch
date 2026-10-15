# Contribution guide

Simple Color Swatch is an Obsidian plugin built with TypeScript, CodeMirror 6,
esbuild, and pnpm. The design source of truth is
[`.agents/PLAN.md`](.agents/PLAN.md); task execution is tracked in
[`.agents/tasks/`](.agents/tasks/).

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
node ./install.mjs
```

The install script copies the compiled plugin files to the test vault or to
the vault specified by the `OBSIDIAN` environment variable.

## Layout

- `src/main.ts` — plugin lifecycle and wiring.
- `src/settings.ts` — persisted settings and the declarative settings tab.
- `src/colors/` — pure color candidate detection and browser CSS validation.
- `src/editor/` — Live Preview CodeMirror decorations.
- `src/reading/` — reading-mode Markdown postprocessor.
- `tests/` — unit tests for pure detection logic.
- `styles.css` — swatch presentation.
- `.agents/PLAN.md` — architecture and behavior requirements.
- `.agents/tasks/` — implementation checklist and task status.

## Conventions

- Keep modules small and strongly typed.
- Keep detection logic free of Obsidian and DOM dependencies where possible.
- Do not modify note content; use decorations or rendered-DOM processing.
- Use pnpm and run the smallest relevant build, lint, and test commands.
- Use conventional commits with a gitmoji.
- Update the relevant task checklist when completing a task.
