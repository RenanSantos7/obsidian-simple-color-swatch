# Plan: obsidian-simple-color-swatch

Obsidian plugin that shows a colored square (swatch) right before color codes, inspired by VS Code's color decorator.

**Project:** `/home/renan/git_repos/obsidian-simple-color-swatch` — plugin id `simple-color-swatch`, name "Simple Color Swatch". The whole project, including this plan, lives in that directory.

**This plan:** lives in `.agents/PLAN.md` and is the source of truth for implementation (convention from search-insert-image-obsidian-plugin). Update it when decisions change.

**No note modification:** the plugin never writes to notes. Swatches are CM6 editor decorations (Live Preview) and DOM-only changes in rendered HTML (reading mode). The only persisted data is the plugin's own settings (`data.json`).

## Supported formats (v1)

- **Hex:** `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`
- **CSS color functions:** `rgb()/rgba()`, `hsl()/hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()` — including modern space-separated syntax with alpha (e.g. `rgb(255 0 0 / 50%)`)
- **No named colors** (`red`, `rebeccapurple`, etc.) in v1

## Recognition rules

| Context | Hex | Functions |
|---|---|---|
| Inline code (`` `#fff` `` or `` `color: #ff0000` ``) | ✔ | ✔ |
| Fenced or indented code blocks | ✔ | ✔ |
| Plain text with escaped `#` (`\#ff0000`) | ✔ | — |
| Plain text without escape | ✘ (avoids tag conflict) | ✔ |

Rationale: `#abc` is a valid Obsidian tag and also a valid hex color. In plain text, hex still requires an escaped `#`; code contexts can safely recognize unescaped hex values.

## Architecture

```
obsidian-simple-color-swatch/
├── .agents/
│   └── PLAN.md               # this plan (source of truth)
├── src/
│   ├── main.ts               # lifecycle + wiring only
│   ├── settings.ts           # interface, defaults, settings tab
│   ├── colors/
│   │   ├── detect.ts         # pure candidate regexes (unit-tested, no DOM)
│   │   └── validate.ts       # CSS.supports('color', value) wrapper (browser only)
│   ├── editor/
│   │   └── extension.ts      # CM6 ViewPlugin + SwatchWidget
│   └── reading/
│       └── postprocessor.ts  # swatches in reading mode
├── tests/detect.test.ts      # regex unit tests (vitest)
├── styles.css                # .scs-swatch
├── manifest.json
└── (esbuild, strict tsconfig, eslint, install.mjs copied from the other plugin)
```

### Detection (`colors/detect.ts` + `colors/validate.ts`)

Regexes find *candidates*; the real validation uses `CSS.supports('color', value)` — the browser's native parser validates any current and future CSS color function for free, without reimplementing range rules. The two live in separate modules because `detect.ts` must stay pure for Node-based unit tests (`CSS.supports` doesn't exist in Node).

### Editor / Live Preview (`editor/extension.ts`)

- `ViewPlugin` from `@codemirror/view` iterating over `visibleRanges`
- Uses the `syntaxTree` to find `InlineCode`, `FencedCode`, and `CodeBlock` nodes (robust, no backtick regex) and scans their code content for colors
- Regex over visible text for escaped `\#hex` and functions in plain text
- `Decoration.widget({ side: -1 })` with a `WidgetType` rendering `<span class="scs-swatch">` with `background-color` — inserted right before each color, without modifying the document
- **Live Preview only**: in Source mode the extension produces no decorations (guard on the view's mode, re-checked on every update)
- Rebuild on `docChanged`/`viewportChanged`; registered via `this.registerEditorExtension()`

### Reading mode (`reading/postprocessor.ts`)

`registerMarkdownPostProcessor` that:

- In `<code>` and standalone `<pre>` elements: scan code text nodes for hex colors and CSS functions
- In other text nodes (via TreeWalker, **skipping** `code`, `pre` and `.tag`): decorate `#hex` and functions
- Detail: in reading mode the `\#` escape has already been consumed by the renderer and tags become `<a class="tag">` elements — skipping `.tag` naturally preserves the escape semantics
- Accepted edge case: digit-only hex (`#123456`) in plain reading-mode text is not a valid Obsidian tag and will be decorated (impossible to know whether it was escaped)

### Settings

Toggles for: editing mode, reading mode, hex, functions. Refresh decorations via a CM6 `Compartment` on change. The settings tab uses the **declarative settings API** (`getSettingDefinitions()` on `PluginSettingTab`, Obsidian 1.13.0+), so `minAppVersion` is pinned to `1.13.0` and no `display()` fallback is implemented.

## Conventions

- pnpm + esbuild + strict TypeScript, small focused modules, minimal `main.ts`
- Conventional commits with gitmoji (`flag: :gitmoji: message`)
- README.md in English (Obsidian standard), AGENTS.md
- No i18n in this project
- `install.mjs` copied/adapted from search-insert-image-obsidian-plugin (git-ignored, reads `OBSIDIAN` from `.env` or the shell environment)
- `manifest.json`: `isDesktopOnly: false`, `minAppVersion: "1.13.0"` (declarative settings API)

## Steps

Execution is tracked in `.agents/tasks/` — tasks group these steps into units of work (mapping in `.agents/tasks/README.md`).

1. **Scaffold** — create `/home/renan/git_repos/obsidian-simple-color-swatch` from the obsidian-sample-plugin base: `manifest.json`, `package.json`, `tsconfig` (strict), `esbuild.config.mjs`, eslint, `.gitignore` + `pnpm install`
2. **`colors/detect.ts`** + regex unit tests (vitest)
3. **`editor/extension.ts`** — ViewPlugin + widget (Live Preview)
4. **`reading/postprocessor.ts`** — reading mode
5. **`settings.ts`** + settings tab
6. **`styles.css`** — ~0.85em square, subtle border, rounded
7. **`main.ts`** — final wiring
8. **Docs** — English `README.md`, `AGENTS.md` (pointing to `.agents/PLAN.md` as the source of truth), adapted `install.mjs`
9. **Verification** — `pnpm build` → `pnpm lint` → `node ./install.mjs` → manual test in the vault

## Out of scope (v1)

- CSS named colors
- Frontmatter / Properties
- Color picker on swatch click

## References

- Similar existing plugin (reference): IroView — https://github.com/NellowTCS/Obsidian-IroView
- Obsidian docs: https://docs.obsidian.md/Plugins
- CodeMirror 6 decorations: https://codemirror.net/docs/view/#decorations
