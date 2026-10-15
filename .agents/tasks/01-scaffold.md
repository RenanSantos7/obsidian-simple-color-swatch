# 01 — Scaffold from sample plugin

**Plan sections:** "Architecture", "Conventions", step 1.

## Goal

A clean, building, empty plugin based on the official sample, ready for feature code.

## Checklist

- [x] Clone `https://github.com/obsidianmd/obsidian-sample-plugin.git` into a temp folder (e.g. `/tmp/opencode/obsidian-sample-plugin`).
- [x] Copy everything except `.git` into the project root; do not overwrite `.agents/`.
- [x] Delete `package-lock.json` from the sample (we use pnpm).
- [x] Delete the sample's `AGENTS.md` and `README.md` (ours come below / in task 06).
- [x] Remove all example code from `src/main.ts` (sample modal, ribbon icon, global handlers, `setInterval`, example settings) — keep a bare `onload`/`onunload`. (`src/settings.ts` removed entirely; recreated in task 05.)
- [x] `git init` (fresh history).
- [x] `manifest.json`: id `simple-color-swatch`, name `Simple Color Swatch`, description ("Shows a color swatch next to CSS color codes, like VS Code."), `author: RenanSantos7`, `isDesktopOnly: false`; set `minAppVersion: "1.13.0"` (required by the declarative settings API used in task 05).
- [x] `package.json`: set `name`/`description` to match the project; add a `test` script placeholder for vitest (wired in task 02).
- [x] Add dependencies `@codemirror/view` and `@codemirror/language` (runtime deps, provided by Obsidian); verify `esbuild.config.mjs` lists them as external — add if missing. *(Both already external in the sample config; added as devDependencies for types.)*
- [x] Add `pnpm-workspace.yaml` with `allowBuilds: esbuild: true` (pnpm blocks esbuild's postinstall otherwise).
- [x] `.gitignore`: merge the sample's entries and add `install.mjs` (local-only).
- [x] Copy `install.mjs` ~~from `search-insert-image-obsidian-plugin`~~ (file no longer exists there; adapted from `markdown-compiler-plugin` instead), target folder from `manifest.id` (`simple-color-swatch`), ESLint ignores it. *(Dropped the version-bump-on-install behavior — versions bump at release time via `version-bump.mjs`.)*
- [x] Short `README.md` in English (project name + one-line description; full docs in task 06).
- [x] `pnpm i`, `pnpm build`, `pnpm lint` all pass.
- [x] `node ./install.mjs` copies the plugin into the test vault (`OBSIDIAN` env var); user enables it and checks it loads. *(Copy verified; loading in Obsidian must be checked manually by the user.)*

## Notes

- The project root already contains `.agents/` (this plan) — never overwrite it when copying from the sample.
- Vitest itself is installed in task 02; here just make sure the scaffold doesn't conflict with a future `tests/` folder.
- `install.mjs` resolves the vault via `OBSIDIAN` env var, falling back to the hardcoded local test vault; the plugin folder comes from `manifest.id`.
- Installed `obsidian` typings are 1.14.4 — the 1.13+ declarative settings API is available.

## Acceptance criteria

- Plugin loads in Obsidian without errors (no commands/features yet). *(manual check pending)*
- `pnpm build` and `pnpm lint` pass; no sample example code remains.
- Git repo initialized with an initial scaffold commit. *(pending commit confirmation)*
