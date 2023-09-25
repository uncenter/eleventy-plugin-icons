import { describe, expect, test } from 'vitest';
import { attributesToString } from '../src/utils';
import { parseSVG } from '../src/svg';

describe('attributesToString()', () => {
	test('should convert single attribute to string', () => {
		expect(attributesToString({ class: 'abc' })).toEqual('class="abc"');
	});

	test('should convert multiple attributes to string', () => {
		expect(attributesToString({ class: 'abc', id: '123' })).toEqual(
			'class="abc" id="123"',
		);
	});
});

describe('parseSVG()', () => {
	test('should add class attribute to SVG element', () => {
		expect(parseSVG('<svg/>', { class: 'abc' }, false)).toContain(
			'<svg class="abc"/>',
		);
	});

	test('should append class to existing class attribute', () => {
		expect(parseSVG('<svg class="abc" />', { class: 'def' }, false)).toContain(
			'<svg class="abc def"/>',
		);
	});

	test('should replace class attribute with new class', () => {
		expect(parseSVG('<svg class="abc" />', { class: 'def' }, true)).toContain(
			'<svg class="def"/>',
		);
	});
});
