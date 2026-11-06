import { describe, expect, it } from 'vitest';
import {
	findCodeColors,
	findEditorTextColors,
	findRenderedTextColors,
	matchInlineColor,
} from '../src/colors/detect';

describe('hex candidates (rendered text)', () => {
	it.each(['#fff', '#FFFF', '#ffffff', '#FF000080'])(
		'accepts valid hex %s',
		(color) => {
			expect(findRenderedTextColors(color)).toEqual([
				{ from: 0, to: color.length, color },
			]);
		},
	);

	it.each(['#ff', '#fffff', '#fffffff', '#fffffffff'])(
		'rejects invalid-length hex %s',
		(color) => {
			expect(findRenderedTextColors(color)).toEqual([]);
		},
	);

	it('rejects non-hex characters', () => {
		expect(findRenderedTextColors('#fffg')).toEqual([]);
		expect(findRenderedTextColors('#xyz')).toEqual([]);
	});
});

describe('editor plain text rules', () => {
	it('matches escaped hex, range starting at the # (after the backslash)', () => {
		expect(findEditorTextColors('xx \\#fff yy')).toEqual([
			{ from: 4, to: 8, color: '#fff' },
		]);
	});

	it('does not match unescaped hex (could be a tag)', () => {
		expect(findEditorTextColors('color #fff here')).toEqual([]);
		expect(findEditorTextColors('#abc')).toEqual([]);
	});

	it('still rejects invalid-length escaped hex', () => {
		expect(findEditorTextColors('\\#fffff')).toEqual([]);
	});
});

describe('color functions', () => {
	it.each([
		'rgb(255, 0, 0)',
		'rgba(255,0,0,0.5)',
		'rgb(255 0 0 / 50%)',
		'hsl(120, 50%, 50%)',
		'hsla(120, 50%, 50%, 0.5)',
		'hwb(120 0% 0%)',
		'lab(50% 40 59.5)',
		'lch(50% 40 270)',
		'oklab(0.5 0.1 0.1)',
		'oklch(0.7 0.15 180)',
		'color(display-p3 1 0 0)',
	])('matches candidate %s', (fn) => {
		expect(findEditorTextColors(fn)).toEqual([
			{ from: 0, to: fn.length, color: fn },
		]);
	});

	it.each([
		'rgb()',
		'rgb(255,0,0',
		'xrgb(1,2,3)',
		'hello world',
	])('rejects %s', (text) => {
		expect(findEditorTextColors(text)).toEqual([]);
	});
});

describe('matchInlineColor (inline code content)', () => {
	it.each(['#fff', '#ff000080', 'rgb(1,2,3)', 'oklch(0.7 0.15 180)'])(
		'matches exact color %s',
		(color) => {
			expect(matchInlineColor(color)).toBe(color);
		},
	);

	it('trims surrounding whitespace', () => {
		expect(matchInlineColor('  #fff  ')).toBe('#fff');
	});

	it.each(['see #fff', '#fffff', 'red', '#fff and rgb(1,2,3)', ''])(
		'rejects non-exact content %s',
		(content) => {
			expect(matchInlineColor(content)).toBeNull();
		},
	);
});

describe('colors inside code content', () => {
	it('finds hex colors embedded in inline or block code', () => {
		expect(findCodeColors('color: #ff0000;')).toEqual([
			{ from: 7, to: 14, color: '#ff0000' },
		]);
	});

	it('finds multiple supported color formats in code', () => {
		expect(findCodeColors('a #fff; b rgb(1, 2, 3)')).toEqual([
			{ from: 2, to: 6, color: '#fff' },
			{ from: 10, to: 22, color: 'rgb(1, 2, 3)' },
		]);
	});
});

describe('options and multiple matches', () => {
	const text = 'a \\#fff b rgb(1,2,3) c';

	it('finds both, sorted by position', () => {
		expect(findEditorTextColors(text)).toEqual([
			{ from: 3, to: 7, color: '#fff' },
			{ from: 10, to: 20, color: 'rgb(1,2,3)' },
		]);
	});

	it('hex: false skips hex', () => {
		expect(findEditorTextColors(text, { hex: false })).toEqual([
			{ from: 10, to: 20, color: 'rgb(1,2,3)' },
		]);
	});

	it('functions: false skips functions', () => {
		expect(findEditorTextColors(text, { functions: false })).toEqual([
			{ from: 3, to: 7, color: '#fff' },
		]);
	});
});
