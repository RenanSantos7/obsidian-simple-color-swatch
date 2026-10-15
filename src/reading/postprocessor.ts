import { MarkdownPostProcessorContext } from 'obsidian';
import { findRenderedTextColors, matchInlineColor } from '../colors/detect';
import { isValidCssColor } from '../colors/validate';

function hasSwatch(element: Element): boolean {
	return element.querySelector('.scs-swatch') !== null;
}

function createSwatch(color: string): HTMLSpanElement {
	const swatch = createSpan({ cls: 'scs-swatch' });
	swatch.style.backgroundColor = color;
	return swatch;
}

function processInlineCode(root: HTMLElement): void {
	for (const code of Array.from(root.querySelectorAll('code'))) {
		if (code.closest('pre') || hasSwatch(code)) continue;

		const color = matchInlineColor(code.textContent ?? '');
		if (!color || !isValidCssColor(color)) continue;
		code.insertBefore(createSwatch(color), code.firstChild);
	}
}

function processTextNode(textNode: Text): void {
	const parent = textNode.parentElement;
	if (!parent) return;

	const matches = findRenderedTextColors(textNode.data)
		.filter((match) => isValidCssColor(match.color))
		.reverse();

	for (const match of matches) {
		const colorNode = textNode.splitText(match.from);
		colorNode.splitText(match.to - match.from);
		parent.insertBefore(createSwatch(match.color), colorNode);
	}
}

function processText(root: HTMLElement): void {
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

	for (const textNode of textNodes) processTextNode(textNode);
}

export function createReadingModePostProcessor() {
	return (root: HTMLElement, _context: MarkdownPostProcessorContext): void => {
		processInlineCode(root);
		processText(root);
	};
}
