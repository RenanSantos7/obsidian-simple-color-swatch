/**
 * Pure CSS color candidate detection.
 *
 * This module has no DOM/Obsidian dependencies so it can be unit-tested in
 * Node. Regexes find *candidates*; final validation happens in the editor /
 * reading layers via `isValidCssColor` (see `./validate.ts`).
 */

export interface ColorMatch {
	from: number;
	to: number;
	/** The exact string to hand to the CSS validator (no leading backslash). */
	color: string;
}

export interface DetectOptions {
	/** Match hex colors. Default: true. */
	hex?: boolean;
	/** Match CSS color functions (rgb, hsl, ...). Default: true. */
	functions?: boolean;
}

const VALID_HEX_LENGTHS = new Set([3, 4, 6, 8]);

const COLOR_FUNCTION_PATTERN =
	'(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\([^()]+\\)';

const FUNCTION_RE = new RegExp(`\\b${COLOR_FUNCTION_PATTERN}`, 'g');
const FULL_FUNCTION_RE = new RegExp(`^${COLOR_FUNCTION_PATTERN}$`);

const ESCAPED_HEX_RE = /\\#([0-9a-fA-F]{3,8})\b/g;
const PLAIN_HEX_RE = /#([0-9a-fA-F]{3,8})\b/g;
const FULL_HEX_RE = /^#([0-9a-fA-F]+)$/;

function collectFunctionMatches(text: string): ColorMatch[] {
	const matches: ColorMatch[] = [];
	for (const m of text.matchAll(FUNCTION_RE)) {
		const from = m.index ?? 0;
		matches.push({ from, to: from + m[0].length, color: m[0] });
	}
	return matches;
}

/**
 * Collects hex candidates. `prefixLength` is the number of characters in the
 * match that precede the `#` (1 for the escaped form `\#fff`, 0 otherwise).
 */
function collectHexMatches(
	text: string,
	re: RegExp,
	prefixLength: number,
): ColorMatch[] {
	const matches: ColorMatch[] = [];
	for (const m of text.matchAll(re)) {
		const digits = m[1];
		if (!digits || !VALID_HEX_LENGTHS.has(digits.length)) continue;
		const from = (m.index ?? 0) + prefixLength;
		matches.push({
			from,
			to: from + 1 + digits.length,
			color: '#' + digits,
		});
	}
	return matches;
}

/**
 * Returns the color when the (trimmed) content is *exactly* one color code —
 * the inline-code rule (`` `#fff` ``, `` `rgb(1, 2, 3)` ``).
 */
export function matchInlineColor(
	content: string,
	options: DetectOptions = {},
): string | null {
	const { hex = true, functions = true } = options;
	const text = content.trim();

	if (hex) {
		const m = FULL_HEX_RE.exec(text);
		if (m && m[1] && VALID_HEX_LENGTHS.has(m[1].length)) return text;
	}
	if (functions && FULL_FUNCTION_RE.test(text)) return text;

	return null;
}

/**
 * Finds color candidates in editor plain text: escaped hex (`\#fff`) and
 * color functions. Unescaped `#fff` is left alone (could be a tag).
 * Ranges for escaped hex start at the `#` (after the backslash).
 */
export function findEditorTextColors(
	text: string,
	options: DetectOptions = {},
): ColorMatch[] {
	const { hex = true, functions = true } = options;
	const matches: ColorMatch[] = [];
	if (hex) matches.push(...collectHexMatches(text, ESCAPED_HEX_RE, 1));
	if (functions) matches.push(...collectFunctionMatches(text));
	return matches.sort((a, b) => a.from - b.from);
}

/**
 * Finds color candidates in reading-mode text nodes: unescaped hex and color
 * functions. The `\#` escape was already consumed by the renderer and tags
 * render as `.tag` elements (excluded by the caller), so plain `#hex` here is
 * safe to decorate.
 */
export function findRenderedTextColors(
	text: string,
	options: DetectOptions = {},
): ColorMatch[] {
	const { hex = true, functions = true } = options;
	const matches: ColorMatch[] = [];
	if (hex) matches.push(...collectHexMatches(text, PLAIN_HEX_RE, 0));
	if (functions) matches.push(...collectFunctionMatches(text));
	return matches.sort((a, b) => a.from - b.from);
}

/**
 * Finds color candidates in code content, where unescaped hex values cannot be
 * confused with Obsidian tags.
 */
export function findCodeColors(
	text: string,
	options: DetectOptions = {},
): ColorMatch[] {
	return findRenderedTextColors(text, options);
}
