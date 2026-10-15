import { MarkdownPostProcessorContext } from 'obsidian';
import { findRenderedTextColors, matchInlineColor } from '../colors/detect';
import { isValidCssColor } from '../colors/validate';

export interface ReadingColorSwatchOptions {
	enabled: boolean;
	hex: boolean;
	functions: boolean;
}

function hasSwatch(element: Element): boolean {
	return element.querySelector('.scs-swatch') !== null;
}

function createSwatch(color: string): HTMLSpanElement {
	const swatch = createSpan({ cls: 'scs-swatch' });
	swatch.style.backgroundColor = color;
	return swatch;
}

function processInlineCode(
	root: HTMLElement,
	options: ReadingColorSwatchOptions,
): void {
	for (const code of Array.from(root.querySelectorAll('code'))) {
		if (code.closest('pre') || hasSwatch(code)) continue;

		const color = matchInlineColor(code.textContent ?? '', {
			hex: options.hex,
			functions: options.functions,
		});
		if (!color || !isValidCssColor(color)) continue;
		code.insertBefore(createSwatch(color), code.firstChild);
	}
}

function processTextNode(
	textNode: Text,
	options: ReadingColorSwatchOptions,
): void {
	const parent = textNode.parentElement;
	if (!parent) return;

	const matches = findRenderedTextColors(textNode.data, {
		hex: options.hex,
		functions: options.functions,
	})
		.filter((match) => isValidCssColor(match.color))
		.reverse();

	for (const match of matches) {
		const colorNode = textNode.splitText(match.from);
		colorNode.splitText(match.to - match.from);
		parent.insertBefore(createSwatch(match.color), colorNode);
	}
}

function processText(root: HTMLElement, options: ReadingColorSwatchOptions): void {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const textNodes: Text[] = [];
	let current: Node | null;

	while ((current = walker.nextNode())) {
		if (current.nodeType !== Node.TEXT_NODE) continue;
		const textNode = current as Text;
		const parent = textNode.parentElement;
		if (
			!parent ||
			parent.closest('code, pre, a.tag, .tag') ||
			parent.closest('.scs-swatch')
		) {
			continue;
		}
		textNodes.push(textNode);
	}

	for (const textNode of textNodes) processTextNode(textNode, options);
}

export function createReadingModePostProcessor(
	getOptions: () => ReadingColorSwatchOptions,
) {
	return (root: HTMLElement, _context: MarkdownPostProcessorContext): void => {
		const options = getOptions();
		if (!options.enabled) return;
		processInlineCode(root, options);
		processText(root, options);
	};
}
