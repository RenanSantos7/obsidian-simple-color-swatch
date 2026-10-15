import { App, MarkdownView } from 'obsidian';
import { syntaxTree } from '@codemirror/language';
import { Compartment, RangeSetBuilder } from '@codemirror/state';
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from '@codemirror/view';
import { findEditorTextColors, matchInlineColor } from '../colors/detect';
import { isValidCssColor } from '../colors/validate';

export interface EditorColorSwatchOptions {
	enabled: boolean;
	hex: boolean;
	functions: boolean;
}

const editorCompartment = new Compartment();

class SwatchWidget extends WidgetType {
	constructor(readonly color: string) {
		super();
	}

	eq(other: SwatchWidget): boolean {
		return other.color === this.color;
	}

	toDOM(): HTMLElement {
		const swatch = document.createElement('span');
		swatch.className = 'scs-swatch';
		swatch.style.backgroundColor = this.color;
		return swatch;
	}

	ignoreEvent(): boolean {
		return true;
	}
}

interface EditorWithCm {
	cm?: EditorView;
}

interface ModeWithSourceFlag {
	sourceMode?: boolean;
}

/**
 * Whether the markdown view owning this editor is in Live Preview.
 * Uses the private `currentMode.sourceMode` flag — isolated here so the
 * rest of the code stays on the public API.
 */
function isLivePreview(app: App, editorView: EditorView): boolean {
	for (const leaf of app.workspace.getLeavesOfType('markdown')) {
		if (!(leaf.view instanceof MarkdownView)) continue;
		const cm = (leaf.view.editor as unknown as EditorWithCm).cm;
		if (cm !== editorView) continue;
		const mode = (leaf.view as unknown as { currentMode?: ModeWithSourceFlag })
			.currentMode;
		return mode?.sourceMode === false;
	}
	return false;
}

function buildDecorations(
	app: App,
	view: EditorView,
	options: EditorColorSwatchOptions,
): DecorationSet {
	if (!options.enabled || !isLivePreview(app, view)) return Decoration.none;

	const widgets: { pos: number; deco: Decoration }[] = [];

	for (const { from, to } of view.visibleRanges) {
		const inlineCodeRanges: { from: number; to: number }[] = [];

		syntaxTree(view.state).iterate({
			from,
			to,
			enter(node) {
				if (node.name !== 'InlineCode') return;
				inlineCodeRanges.push({ from: node.from, to: node.to });

				const first = node.node.firstChild;
				const last = node.node.lastChild;
				if (!first || !last) return;

				const contentFrom = first.to; // after the opening backtick run
				const contentTo = last.from; // before the closing backtick run
				if (contentFrom >= contentTo) return;

				const content = view.state.doc.sliceString(contentFrom, contentTo);
				const color = matchInlineColor(content, {
					hex: options.hex,
					functions: options.functions,
				});
				if (!color || !isValidCssColor(color)) return;

				const leading = content.length - content.trimStart().length;
				widgets.push({
					pos: contentFrom + leading,
					deco: Decoration.widget({
						widget: new SwatchWidget(color),
						side: -1,
					}),
				});
			},
		});

		// Plain text: escaped hex + color functions (validated, not in inline code).
		const text = view.state.doc.sliceString(from, to);
		for (const match of findEditorTextColors(text, {
			hex: options.hex,
			functions: options.functions,
		})) {
			if (!isValidCssColor(match.color)) continue;
			const absFrom = from + match.from;
			const absTo = from + match.to;
			const insideInlineCode = inlineCodeRanges.some(
				(r) => absFrom >= r.from && absTo <= r.to,
			);
			if (insideInlineCode) continue;
			widgets.push({
				pos: absFrom,
				deco: Decoration.widget({
					widget: new SwatchWidget(match.color),
					side: -1,
				}),
			});
		}
	}

	widgets.sort((a, b) => a.pos - b.pos);
	const builder = new RangeSetBuilder<Decoration>();
	for (const { pos, deco } of widgets) {
		builder.add(pos, pos, deco);
	}
	return builder.finish();
}

function createViewPlugin(
	app: App,
	getOptions: () => EditorColorSwatchOptions,
) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			private livePreview: boolean;

			constructor(view: EditorView) {
				this.livePreview = isLivePreview(app, view);
				this.decorations = this.livePreview
					? buildDecorations(app, view, getOptions())
					: Decoration.none;
			}

			update(update: ViewUpdate) {
				const livePreview = isLivePreview(app, update.view);
				const modeChanged = livePreview !== this.livePreview;
				this.livePreview = livePreview;
				if (!livePreview || !getOptions().enabled) {
					this.decorations = Decoration.none;
					return;
				}
				if (update.docChanged || update.viewportChanged || modeChanged) {
					this.decorations = buildDecorations(app, update.view, getOptions());
				}
			}
		},
		{ decorations: (value) => value.decorations },
	);
}

export function createColorSwatchExtension(
	app: App,
	getOptions: () => EditorColorSwatchOptions,
) {
	return editorCompartment.of(createViewPlugin(app, getOptions));
}

export function refreshColorSwatchEditors(
	app: App,
	getOptions: () => EditorColorSwatchOptions,
): void {
	for (const leaf of app.workspace.getLeavesOfType('markdown')) {
		if (!(leaf.view instanceof MarkdownView)) continue;
		const cm = (leaf.view.editor as unknown as EditorWithCm).cm;
		cm?.dispatch({
			effects: editorCompartment.reconfigure(createViewPlugin(app, getOptions)),
		});
	}
}
