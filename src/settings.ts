import {
	App,
	PluginSettingTab,
	SettingDefinitionItem,
} from 'obsidian';
import type SimpleColorSwatchPlugin from './main';

export interface ColorSwatchSettings {
	enabledInEditing: boolean;
	enabledInReading: boolean;
	hexEnabled: boolean;
	functionsEnabled: boolean;
}

export const DEFAULT_SETTINGS: ColorSwatchSettings = {
	enabledInEditing: true,
	enabledInReading: true,
	hexEnabled: true,
	functionsEnabled: true,
};

export class ColorSwatchSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly colorSwatchPlugin: SimpleColorSwatchPlugin,
	) {
		super(app, colorSwatchPlugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Show swatches in editing mode',
				desc: 'Display swatches while editing notes in Live Preview.',
				control: {
					type: 'toggle',
					key: 'enabledInEditing',
					defaultValue: DEFAULT_SETTINGS.enabledInEditing,
				},
			},
			{
				name: 'Show swatches in reading mode',
				desc: 'Display swatches in rendered notes.',
				control: {
					type: 'toggle',
					key: 'enabledInReading',
					defaultValue: DEFAULT_SETTINGS.enabledInReading,
				},
			},
			{
				name: 'Recognize hexadecimal colors',
				desc: 'Recognize hexadecimal colors such as #fff and #ff000080.',
				control: {
					type: 'toggle',
					key: 'hexEnabled',
					defaultValue: DEFAULT_SETTINGS.hexEnabled,
				},
			},
			{
				name: 'Recognize CSS color functions',
				desc: 'Recognize functions such as rgb(), hsl(), and oklch().',
				control: {
					type: 'toggle',
					key: 'functionsEnabled',
					defaultValue: DEFAULT_SETTINGS.functionsEnabled,
				},
			},
		];
	}

	getControlValue(key: string): unknown {
		return this.colorSwatchPlugin.settings[key as keyof ColorSwatchSettings];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (!isSettingsKey(key) || typeof value !== 'boolean') {
			throw new Error(`Invalid color swatch setting: ${key}`);
		}

		this.colorSwatchPlugin.settings[key] = value;
		await this.colorSwatchPlugin.saveSettings();
		this.colorSwatchPlugin.refreshSettings();
	}
}

function isSettingsKey(key: string): key is keyof ColorSwatchSettings {
	return key in DEFAULT_SETTINGS;
}
