import { MarkdownPostProcessorContext } from 'obsidian';
import { findCodeColors, findRenderedTextColors } from '../colors/detect';
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
	const swatch = document.createElement('span');
	swatch.className = 'scs-swatch';
	swatch.style.backgroundColor = color;
	return swatch;
}

function processCode(
	root: HTMLElement,
	options: ReadingColorSwatchOptions,
): void {
	const codeElements = Array.from(root.querySelectorAll('code, pre'));
	if (root.matches('code, pre')) codeElements.unshift(root);

	for (const code of codeElements) {
		if (
			(code.tagName === 'PRE' && code.querySelector('code')) ||
			hasSwatch(code)
		) {
			continue;
		}

		const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
		const textNodes: Text[] = [];
		let current: Node | null;
		while ((current = walker.nextNode())) {
			if (current.nodeType !== Node.TEXT_NODE) continue;
			if ((current as Text).parentElement?.closest('.scs-swatch')) continue;
			textNodes.push(current as Text);
		}

		const codeText = textNodes.map((textNode) => textNode.data).join('');
		const matches = findCodeColors(codeText, {
			hex: options.hex,
			functions: options.functions,
		})
			.filter((match) => isValidCssColor(match.color))
			.reverse();

		for (const match of matches) {
			let textOffset = 0;
			for (const textNode of textNodes) {
				const nodeEnd = textOffset + textNode.data.length;
				if (match.from < nodeEnd) {
					const range = document.createRange();
					range.setStart(textNode, match.from - textOffset);
					range.collapse(true);
					range.insertNode(createSwatch(match.color));
					break;
				}
				textOffset = nodeEnd;
			}
		}
	}
}

function processCodeAfterHighlight(
	root: HTMLElement,
	options: ReadingColorSwatchOptions,
): void {
	processCode(root, options);

	const codeElements = Array.from(root.querySelectorAll('code'));
	if (root.matches('code')) codeElements.unshift(root);
	const hasPendingHighlight = () =>
		codeElements.some(
			(code) =>
				Array.from(code.classList).some((className) =>
					className.startsWith('language-'),
				) && !code.classList.contains('is-loaded'),
		);

	if (!hasPendingHighlight()) return;

	const observer = new MutationObserver(() => {
		processCode(root, options);
		if (!hasPendingHighlight()) observer.disconnect();
	});
	observer.observe(root, {
		attributes: true,
		attributeFilter: ['class'],
		childList: true,
		subtree: true,
	});
	window.setTimeout(() => observer.disconnect(), 5000);
}

function processTextNode(
	textNode: Text,
	options: ReadingColorSwatchOptions,
	findColors = findRenderedTextColors,
): void {
	const parent = textNode.parentElement;
	if (!parent) return;

	const matches = findColors(textNode.data, {
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
		processCodeAfterHighlight(root, options);
		processText(root, options);
	};
}
