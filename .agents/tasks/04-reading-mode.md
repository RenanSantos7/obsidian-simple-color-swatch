# 04 — Reading mode swatches

**Plan sections:** "Reading mode (`reading/postprocessor.ts`)", step 4.

## Goal

Color swatches render in reading mode per the recognition rules.

## Checklist

- [x] Create `src/reading/postprocessor.ts` and register it in `main.ts` via `this.registerMarkdownPostProcessor()`:
  - [x] Scan text nodes in `<code>` and standalone `<pre>` elements for hex colors and CSS functions; insert a `.scs-swatch` before each valid color.
  - [x] Walk text nodes with a `TreeWalker` (`NodeFilter.SHOW_TEXT`), skipping any node whose ancestor matches `code, pre, a.tag, .tag`.
  - [x] In each remaining text node, find colors with `findRenderedTextColors` (unescaped hex allowed — the `\#` escape was already consumed by the renderer), validate, and insert a `.scs-swatch` span before each match (split the text node; process matches right-to-left or rebuild the fragment).
- [x] `pnpm build`, `pnpm lint`, `node ./install.mjs` pass.

## Notes

- Tags render as `<a class="tag">`, so skipping `.tag` preserves the escape semantics: `\#fff` renders as literal text (swatch), while `#fff` becomes a tag element (no swatch).
- Accepted edge case (documented in the plan): digit-only hex like `#123456` in plain text is not a valid Obsidian tag, so it gets a swatch in reading mode even if unescaped.
- Post processors receive rendered element subtrees; make the function idempotent (don't re-decorate an element that already contains `.scs-swatch`).

## Acceptance criteria

In reading mode, swatches appear for:

- [x] `` `#fff` `` (inline code with only the color)
- [x] Hex colors and CSS functions embedded in inline code and fenced code blocks
- [x] `\#ff0000` in the source (renders as `#ff0000`)
- [x] `rgb(255, 0, 0)` in plain text

In reading mode, swatches do not appear for:
- [x] Tag `#abc` (renders as a normal tag, no swatch)
