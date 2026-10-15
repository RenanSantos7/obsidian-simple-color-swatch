# 03 — Live Preview swatches

**Plan sections:** "Editor / Live Preview (`editor/extension.ts`)", step 3 + `styles.css` from step 6.

## Goal

Color swatches render in the editor per the recognition rules — **Live Preview only, never in Source mode**.

## Checklist

- [x] Create `src/editor/extension.ts`:
  - [x] `SwatchWidget extends WidgetType`: `toDOM()` returns `<span class="scs-swatch">` with `backgroundColor` set to the color; `eq()` compares by color string.
  - [x] `ViewPlugin` building a `DecorationSet` over `view.visibleRanges`:
    - [x] Iterate `syntaxTree(view.state)` for `InlineCode` nodes intersecting the visible ranges; test inner content (between the backtick runs) with `matchInlineColor`; widget at the start of the color text (right after the opening backticks), `Decoration.widget({ side: -1 })`.
    - [x] Scan visible text with `findEditorTextColors` (escaped hex + functions); validate each candidate with `isValidCssColor`; widget before the color text (for escaped hex, before the `#` — after the backslash).
    - [x] Skip plain-text matches inside `InlineCode` nodes (inline code is handled exclusively by the inline rule — avoids duplicate widgets for `` `rgb(1,2,3)` ``).
    - [x] Build with `RangeSetBuilder` (sorted ranges).
  - [x] Source-mode guard: return `Decoration.none` when the owning markdown view is in Source mode. Detect the mode per editor (private API `currentMode.sourceMode` on the `MarkdownView`, isolated in one helper) and re-check on every `update()` so toggling between Source and Live Preview refreshes the decorations.
  - [x] Rebuild decorations on `docChanged` or `viewportChanged`.
- [x] Register the extension in `main.ts` via `this.registerEditorExtension()` (unconditional for now; the settings `Compartment` comes in task 05).
- [x] `styles.css`: `.scs-swatch` — ~0.85em inline-block square, subtle border (`var(--background-modifier-border)`), `border-radius: 3px`, small right margin, vertically aligned with text.
- [x] `pnpm build`, `pnpm lint`, `node ./install.mjs` pass.

## Notes

- Live Preview and Source mode share the same CM6 editor, so the guard must run at decoration-build time — registering the extension conditionally is not enough.
- `InlineCode` nodes from the Markdown syntax tree include the backticks; the content starts after the opening backtick run (1+ backticks).
- Performance: only the viewport is scanned; regex work is cheap and `syntaxTree` is already parsed by Obsidian.

## Acceptance criteria

In a note (Live Preview), swatches appear for:

- [x] `` `#fff` ``, `` `#ff000080` `` (inline code, only the color)
- [x] `\#ff0000` (escaped, plain text)
- [x] `rgb(255, 0, 0)`, `oklch(0.7 0.15 180)` (plain text)

In a note swatches **must** not appear for:
- [x] `#fff` (unescaped, plain text) and tag `#abc`;
- [x] `rgb(999, 0, 0)`, `rgb(1, 3, 4, 5, 6)` or `rgb()` (fails `CSS.supports` validation);
- [x] anywhere in Source mode (switching back to Live Preview restores the swatches).
