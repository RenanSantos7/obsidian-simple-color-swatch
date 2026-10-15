# 05 — Settings tab

**Plan sections:** "Settings", step 5 + `main.ts` wiring from step 7.

## Goal

A settings tab with toggles that take effect immediately, and `main.ts` reduced to pure lifecycle wiring.

## Checklist

- [x] Create `src/settings.ts`:
  - [x] `ColorSwatchSettings` interface + `DEFAULT_SETTINGS`: `enabledInEditing`, `enabledInReading`, `hexEnabled`, `functionsEnabled` (all default `true`).
  - [x] `ColorSwatchSettingTab` using the **declarative settings API** (Obsidian 1.13+, no `display()` override): `getSettingDefinitions(): SettingDefinitionItem[]` returns one `SettingDefinitionControl` per setting with `control: { type: 'toggle', key, defaultValue }` (sentence-case `name`/`desc`, per Obsidian guidelines).
  - [x] Override `getControlValue(key)` / `setControlValue(key, value)` to read/write `plugin.settings`, persist via `saveSettings()`, and apply the change live (editor reconfigure / preview rerender from the items below).
- [x] `main.ts`: `loadSettings()` (merge `DEFAULT_SETTINGS` + `loadData()`), `saveSettings()`, `addSettingTab()`; keep `onload` light.
- [x] Pass settings into the detection layers (the options parameter from task 02: hex/functions toggles).
- [x] Editor toggles: wrap the CM6 extension in a `Compartment`; on change, reconfigure all open editors (iterate markdown leaves and dispatch to each `view.editor`'s CM6 instance — private-API access is an accepted tradeoff, isolate it in one helper).
- [x] Reading toggles: on change, rerender open markdown previews.
- [x] `pnpm build`, `pnpm lint`, `node ./install.mjs` pass.

## Notes

- The declarative settings API requires Obsidian ≥ 1.13.0, so `minAppVersion` is pinned to `1.13.0` in `manifest.json` (set in task 01) and no `display()` fallback is needed. Bonus: the tab's settings become searchable in Obsidian's settings search.
- If reconfiguring live editors proves fragile, document in the settings description that a note reload is needed — but try the `Compartment` + dispatch approach first.
- Unload safety: everything registered via `this.register*` helpers.

## Acceptance criteria

- [x] Each toggle takes effect without restarting Obsidian (editing and reading).
- [x] Settings persist across restarts.
- [x] With hex disabled, `\#fff` and `` `#fff` `` show no swatch while `rgb(1,2,3)` still does (and vice-versa).
- [x] The plugin's settings appear in Obsidian's settings search (declarative API).
