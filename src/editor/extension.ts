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
import { findCodeColors, findEditorTextColors } from '../colors/detect';
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
		const swatch = createSpan({ cls: 'scs-swatch' });
		swatch.setCssProps({ '--scs-swatch-color': this.color });
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
	const codeRanges: { from: number; to: number }[] = [];
	const scannedCodeRanges = new Set<string>();
	const widgetPositions = new Set<number>();

	for (const { from, to } of view.visibleRanges) {
		const addCodeMatches = (text: string, offset: number) => {
			for (const match of findCodeColors(text, {
				hex: options.hex,
				functions: options.functions,
			})) {
				if (!isValidCssColor(match.color)) continue;
				const pos = offset + match.from;
				if (widgetPositions.has(pos)) continue;
				widgetPositions.add(pos);
				widgets.push({
					pos,
					deco: Decoration.widget({
						widget: new SwatchWidget(match.color),
						side: -1,
					}),
				});
			}
		};

		syntaxTree(view.state).iterate({
			from,
			to,
			enter(node) {
				const nodeName = node.name.toLowerCase();
				const isBlockCode =
					nodeName.includes('fencedcode') || nodeName.includes('codeblock');
				const isInlineCode =
					nodeName.includes('code') &&
					!isBlockCode &&
					!nodeName.includes('codeinfo') &&
					!nodeName.includes('codemark');
				if (isInlineCode) {
					const rangeKey = `${node.from}:${node.to}`;
					if (scannedCodeRanges.has(rangeKey)) return;
					scannedCodeRanges.add(rangeKey);
					codeRanges.push({ from: node.from, to: node.to });

					const nodeText = view.state.doc.sliceString(node.from, node.to);
					const opening = nodeText.match(/^`+/)?.[0];
					const closing = nodeText.match(/`+$/)?.[0];
					let contentFrom = node.from;
					let contentTo = node.to;
					if (
						opening &&
						closing &&
						opening.length + closing.length <= nodeText.length
					) {
						contentFrom += opening.length;
						contentTo -= closing.length;
					}

					if (contentFrom >= contentTo) return;

					addCodeMatches(
						view.state.doc.sliceString(contentFrom, contentTo),
						contentFrom,
					);
					return;
				}

				if (!isBlockCode) return;
				const rangeKey = `${node.from}:${node.to}`;
				if (scannedCodeRanges.has(rangeKey)) return;
				scannedCodeRanges.add(rangeKey);
				codeRanges.push({ from: node.from, to: node.to });
				const code = view.state.doc.sliceString(node.from, node.to);
				let lineOffset = 0;
				for (const line of code.split('\n')) {
					// Fence markers and their optional language identifier are not code.
					if (!/^\s{0,3}(?:`{3,}|~{3,})/.test(line)) {
						addCodeMatches(line, node.from + lineOffset);
					}
					lineOffset += line.length + 1;
				}
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
			const insideCode = codeRanges.some(
				(r) => absFrom >= r.from && absTo <= r.to,
			);
			if (insideCode) continue;
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
