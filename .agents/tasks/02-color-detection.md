# 02 — Color detection + unit tests

**Plan sections:** "Supported formats", "Recognition rules", "Detection (`colors/detect.ts`)", step 2.

## Goal

Pure, testable color-detection module with no Obsidian/DOM imports, plus a thin browser-validation wrapper.

## Checklist

- [x] Install `vitest` as a devDependency; add `test` script (`vitest run`); make sure `tsc -noEmit` and ESLint handle the `tests/` folder. *(tsconfig `include` extended with `tests/**/*.ts`; no vitest config file needed.)*
- [x] Create `src/colors/detect.ts` (pure, no DOM/Obsidian imports):
  - [x] `matchInlineColor(content: string): string | null` — returns the color when the trimmed content is *exactly* one color code (hex without escape, or a color-function candidate); `null` otherwise.
  - [x] `findEditorTextColors(text: string): ColorMatch[]` — candidates in editor plain text: escaped hex (`\#…`) and function candidates.
  - [x] `findRenderedTextColors(text: string): ColorMatch[]` — candidates in reading-mode text nodes: unescaped hex (the `\#` escape was already consumed by the renderer; tags are excluded by the caller) and function candidates.
  - [x] `ColorMatch = { from: number; to: number; color: string }` — `color` is the exact string to hand to the CSS validator.
  - [x] Hex validation: only lengths 3, 4, 6, 8 (reject 1, 2, 5, 7 digits and longer runs).
  - [x] Function candidates: `rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color` followed by `(…)` (balanced-enough regex, no `)` inside); word boundaries so `xrgb(…)` doesn't match.
  - [x] Options parameter to disable hex or functions (used by settings in task 05).
- [x] Create `src/colors/validate.ts`: `isValidCssColor(value: string): boolean` wrapping `CSS.supports('color', value)` with a guard for environments without `CSS`.
- [x] `tests/detect.test.ts` covering:
  - [x] Hex: valid 3/4/6/8 (upper/lower case, with alpha); invalid 5/7 digits; `#ff0000ff`.
  - [x] Editor rules: `\#fff` matches (range starts at the `#`, after the backslash); unescaped `#fff` in plain text does **not** match; `#fff` adjacent to a tag-like word does not leak.
  - [x] Functions: `rgb(255, 0, 0)`, `rgba(255,0,0,0.5)`, `rgb(255 0 0 / 50%)`, `hsl(120, 50%, 50%)`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color(display-p3 1 0 0)` all match as candidates.
  - [x] Rejects: `rgb()` empty, `rgb(255,0,0` unclosed, `xrgb(1,2,3)`, plain words.
  - [x] `matchInlineColor`: `` `#fff` `` content matches; `` `see #fff` `` (extra text) does not.
- [x] `pnpm test`, `pnpm build`, `pnpm lint` all pass. *(40 tests green.)*

## Notes

- `CSS.supports` doesn't exist in Node, so validation is deliberately kept out of `detect.ts` — unit tests exercise candidates only; `validate.ts` is one browser-API call used by the editor/reading layers (tasks 03/04).
- Candidate regexes may be slightly permissive; `validate.ts` is the final gate. False candidates are cheap — invalid ones just don't render a swatch.
- Function candidates require at least one char inside the parens (`[^()]+`), so `rgb()` isn't even a candidate.

## Acceptance criteria

- All tests green; detection logic has zero Obsidian/DOM dependencies.
- Behavior matches the "Recognition rules" table in `.agents/PLAN.md`.
