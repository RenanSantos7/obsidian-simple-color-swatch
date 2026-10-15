/**
 * Final color validation using the browser's native CSS parser.
 * Browser-only — candidates from `./detect.ts` are passed through this in
 * the editor and reading layers before any swatch is rendered.
 */
export function isValidCssColor(value: string): boolean {
	if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
		return false;
	}
	return CSS.supports('color', value);
}
