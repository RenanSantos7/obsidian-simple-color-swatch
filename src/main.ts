import { Plugin } from 'obsidian';
import { createColorSwatchExtension } from './editor/extension';
import { createReadingModePostProcessor } from './reading/postprocessor';

export default class SimpleColorSwatchPlugin extends Plugin {
	onload() {
		this.registerEditorExtension(createColorSwatchExtension(this.app));
		this.registerMarkdownPostProcessor(createReadingModePostProcessor());
	}

	onunload() {}
}
