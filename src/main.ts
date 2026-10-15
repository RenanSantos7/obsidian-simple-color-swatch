import { Plugin } from 'obsidian';
import { createColorSwatchExtension } from './editor/extension';

export default class SimpleColorSwatchPlugin extends Plugin {
	onload() {
		this.registerEditorExtension(createColorSwatchExtension(this.app));
	}

	onunload() {}
}
