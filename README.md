# Simple Color Swatch

Simple Color Swatch shows a small colored square next to CSS color codes in
Obsidian, inspired by the color decorator in VS Code.

## Supported colors

The plugin recognizes:

- Hexadecimal colors: `#RGB`, `#RGBA`, `#RRGGBB`, and `#RRGGBBAA`.
- CSS color functions: `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hwb()`, `lab()`,
  `lch()`, `oklab()`, `oklch()`, and `color()`.

Named colors such as `red` are not recognized.

## Where swatches appear

| Context | Hex colors | CSS functions |
| --- | --- | --- |
| Inline code containing only the color, for example `` `#fff` `` | Yes | Yes |
| Escaped hex in plain text, for example `\#ff0000` | Yes | — |
| Plain-text functions, for example `rgb(255, 0, 0)` | — | Yes |

Unescaped hex values in plain text are not decorated in Live Preview because
they can be Obsidian tags. Reading mode skips rendered tag elements as well.
Invalid CSS values are rejected by the browser's native CSS parser.

## Settings

The settings tab provides independent toggles for:

- Editing mode (Live Preview).
- Reading mode.
- Hexadecimal colors.
- CSS color functions.

Changes apply to open notes immediately and are persisted in the plugin data.

## Installation

Download the release assets from the plugin's GitHub release page and copy
`main.js`, `manifest.json`, and `styles.css` into:

```text
<vault>/.obsidian/plugins/simple-color-swatch/
```

Then enable **Simple Color Swatch** in Obsidian's Community Plugins settings.

## Development

```bash
pnpm install
pnpm dev       # watch and rebuild
pnpm build
pnpm lint
pnpm test
node ./install.mjs
```

`install.mjs` copies the compiled plugin to the vault in the `OBSIDIAN`
environment variable, or to the repository's configured local test vault when
that variable is not set.

## Notes and privacy

The plugin never modifies note files. Swatches are editor decorations in Live
Preview and DOM-only additions in reading mode. The only persisted data is the
plugin's own settings.

The design source of truth is [`.agents/PLAN.md`](.agents/PLAN.md), and
execution progress is tracked in [`.agents/tasks/`](.agents/tasks/).
