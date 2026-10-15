# 02 — Color detection + unit tests

**Plan sections:** "Supported formats", "Recognition rules", "Detection (`colors/detect.ts`)", step 2.

## Goal

Pure, testable color-detection module with no Obsidian/DOM imports, plus a thin browser-validation wrapper.

## Checklist

- [ ] Install `vitest` as a devDependency; add `test` script (`vitest run`); make sure `tsc -noEmit` and ESLint handle the `tests/` folder.
- [ ] Create `src/colors/detect.ts` (pure, no DOM/Obsidian imports):
  - [ ] `matchInlineColor(content: string): string | null` — returns the color when the trimmed content is *exactly* one color code (hex without escape, or a color-function candidate); `null` otherwise.
  - [ ] `findEditorTextColors(text: string): ColorMatch[]` — candidates in editor plain text: escaped hex (`\#…`) and function candidates.
  - [ ] `findRenderedTextColors(text: string): ColorMatch[]` — candidates in reading-mode text nodes: unescaped hex (the `\#` escape was already consumed by the renderer; tags are excluded by the caller) and function candidates.
  - [ ] `ColorMatch = { from: number; to: number; color: string }` — `color` is the exact string to hand to the CSS validator.
  - [ ] Hex validation: only lengths 3, 4, 6, 8 (reject 1, 2, 5, 7 digits and longer runs).
  - [ ] Function candidates: `rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color` followed by `(…)` (balanced-enough regex, no `)` inside); word boundaries so `xrgb(…)` doesn't match.
  - [ ] Options parameter to disable hex or functions (used by settings in task 05).
- [ ] Create `src/colors/validate.ts`: `isValidCssColor(value: string): boolean` wrapping `CSS.supports('color', value)` with a guard for environments without `CSS`.
- [ ] `tests/detect.test.ts` covering:
  - [ ] Hex: valid 3/4/6/8 (upper/lower case, with alpha); invalid 5/7 digits; `#ff0000ff`.
  - [ ] Editor rules: `\#fff` matches (range starts at the `#`, after the backslash); unescaped `#fff` in plain text does **not** match; `#fff` adjacent to a tag-like word does not leak.
  - [ ] Functions: `rgb(255, 0, 0)`, `rgba(255,0,0,0.5)`, `rgb(255 0 0 / 50%)`, `hsl(120, 50%, 50%)`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color(display-p3 1 0 0)` all match as candidates.
  - [ ] Rejects: `rgb()` empty, `rgb(255,0,0` unclosed, `xrgb(1,2,3)`, plain words.
  - [ ] `matchInlineColor`: `` `#fff` `` content matches; `` `see #fff` `` (extra text) does not.
- [ ] `pnpm test`, `pnpm build`, `pnpm lint` all pass.

## Notes

- `CSS.supports` doesn't exist in Node, so validation is deliberately kept out of `detect.ts` — unit tests exercise candidates only; `validate.ts` is one browser-API call used by the editor/reading layers (tasks 03/04).
- - Candidate regexes may be slightly permissive (e.g. `rgb(1,2,3,4,5)`); `validate.ts` is the final gate. False candidates are cheap — invalid ones just don't render a swatch.

## Acceptance criteria

- All tests green; detection logic has zero Obsidian/DOM dependencies.
- Behavior matches the "Recognition rules" table in `.agents/PLAN.md`.
