import { describe, expect, test } from 'vitest';

import { _processXMLIcon } from '../src/svg';
import { attributesToString } from '../src/utils';

describe('attributesToString()', () => {
	test('should convert single attribute to string', () => {
		expect(attributesToString({ class: 'abc' })).toBe('class="abc"');
	});

	test('should convert multiple attributes to string', () => {
		expect(attributesToString({ class: 'abc', id: '123' })).toBe(
			'class="abc" id="123"',
		);
	});
});

describe('_parseSVG_internal()', () => {
	test('should add class attribute to SVG element', () => {
		expect(_processXMLIcon('<svg/>', { class: 'abc' }, false)).toContain(
			'<svg class="abc"/>',
		);
	});

	test('should append class to existing class attribute', () => {
		expect(
			_processXMLIcon('<svg class="abc" />', { class: 'def' }, false),
		).toContain('<svg class="abc def"/>');
	});

	test('should replace class attribute with new class', () => {
		expect(
			_processXMLIcon('<svg class="abc" />', { class: 'def' }, true),
		).toContain('<svg class="def"/>');
	});
});
