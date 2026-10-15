# 05 — Settings tab

**Plan sections:** "Settings", step 5 + `main.ts` wiring from step 7.

## Goal

A settings tab with toggles that take effect immediately, and `main.ts` reduced to pure lifecycle wiring.

## Checklist

- [ ] Create `src/settings.ts`:
  - [ ] `ColorSwatchSettings` interface + `DEFAULT_SETTINGS`: `enabledInEditing`, `enabledInReading`, `hexEnabled`, `functionsEnabled` (all default `true`).
  - [ ] `ColorSwatchSettingTab` using the **declarative settings API** (Obsidian 1.13+, no `display()` override): `getSettingDefinitions(): SettingDefinitionItem[]` returns one `SettingDefinitionControl` per setting with `control: { type: 'toggle', key, defaultValue }` (sentence-case `name`/`desc`, per Obsidian guidelines).
  - [ ] Override `getControlValue(key)` / `setControlValue(key, value)` to read/write `plugin.settings`, persist via `saveSettings()`, and apply the change live (editor reconfigure / preview rerender from the items below).
- [ ] `main.ts`: `loadSettings()` (merge `DEFAULT_SETTINGS` + `loadData()`), `saveSettings()`, `addSettingTab()`; keep `onload` light.
- [ ] Pass settings into the detection layers (the options parameter from task 02: hex/functions toggles).
- [ ] Editor toggles: wrap the CM6 extension in a `Compartment`; on change, reconfigure all open editors (iterate markdown leaves and dispatch to each `view.editor`'s CM6 instance — private-API access is an accepted tradeoff, isolate it in one helper).
- [ ] Reading toggles: on change, rerender open markdown previews.
- [ ] `pnpm build`, `pnpm lint`, `node ./install.mjs` pass.

## Notes

- The declarative settings API requires Obsidian ≥ 1.13.0, so `minAppVersion` is pinned to `1.13.0` in `manifest.json` (set in task 01) and no `display()` fallback is needed. Bonus: the tab's settings become searchable in Obsidian's settings search.
- If reconfiguring live editors proves fragile, document in the settings description that a note reload is needed — but try the `Compartment` + dispatch approach first.
- Unload safety: everything registered via `this.register*` helpers.

## Acceptance criteria

- [ ] Each toggle takes effect without restarting Obsidian (editing and reading).
- [ ] Settings persist across restarts.
- [ ] With hex disabled, `\#fff` and `` `#fff` `` show no swatch while `rgb(1,2,3)` still does (and vice-versa).
- [ ] The plugin's settings appear in Obsidian's settings search (declarative API).
