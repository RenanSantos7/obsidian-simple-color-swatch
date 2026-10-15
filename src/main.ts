import { MarkdownView, Plugin } from 'obsidian';
import {
	createColorSwatchExtension,
	refreshColorSwatchEditors,
} from './editor/extension';
import { createReadingModePostProcessor } from './reading/postprocessor';
import {
	ColorSwatchSettingTab,
	ColorSwatchSettings,
	DEFAULT_SETTINGS,
} from './settings';

export default class SimpleColorSwatchPlugin extends Plugin {
	settings: ColorSwatchSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();
		this.registerEditorExtension(
			createColorSwatchExtension(this.app, () => this.editorOptions),
		);
		this.registerMarkdownPostProcessor(
			createReadingModePostProcessor(() => this.readingOptions),
		);
		this.addSettingTab(new ColorSwatchSettingTab(this.app, this));
	}

	get editorOptions() {
		return {
			enabled: this.settings.enabledInEditing,
			hex: this.settings.hexEnabled,
			functions: this.settings.functionsEnabled,
		};
	}

	get readingOptions() {
		return {
			enabled: this.settings.enabledInReading,
			hex: this.settings.hexEnabled,
			functions: this.settings.functionsEnabled,
		};
	}

	async loadSettings(): Promise<void> {
		const data: unknown = await this.loadData();
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			isSettingsData(data) ? data : {},
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	refreshSettings(): void {
		refreshColorSwatchEditors(this.app, () => this.editorOptions);
		for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
			leaf.view instanceof MarkdownView &&
				leaf.view.previewMode.rerender(true);
		}
	}

	onunload() {}
}

function isSettingsData(value: unknown): value is Partial<ColorSwatchSettings> {
	if (typeof value !== 'object' || value === null) return false;
	const data = value as Record<string, unknown>;
	return (
		(data.enabledInEditing === undefined ||
			typeof data.enabledInEditing === 'boolean') &&
		(data.enabledInReading === undefined ||
			typeof data.enabledInReading === 'boolean') &&
		(data.hexEnabled === undefined || typeof data.hexEnabled === 'boolean') &&
		(data.functionsEnabled === undefined ||
			typeof data.functionsEnabled === 'boolean')
	);
}
