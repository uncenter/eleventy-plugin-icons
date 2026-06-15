import { describe, expect, test } from 'vitest';

import { _processXMLIcon } from '../src/svg';
import { attributesToString, mergeAttributes } from '../src/utils';

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

describe('mergeAttributes()', () => {
	test('should space-join values for merge keys', () => {
		expect(
			mergeAttributes(['class'], [{ class: 'a' }, { class: 'b' }]),
		).toEqual({ class: 'a b' });
	});

	test('should overwrite non-merge keys', () => {
		expect(
			mergeAttributes([], [{ viewBox: '0 0 16 16' }, { viewBox: '0 0 24 24' }]),
		).toEqual({ viewBox: '0 0 24 24' });
	});

	test('should include keys present in only one object', () => {
		expect(mergeAttributes([], [{ fill: 'red' }, { stroke: 'blue' }])).toEqual({
			fill: 'red',
			stroke: 'blue',
		});
	});

	test('should merge some keys and overwrite others', () => {
		expect(
			mergeAttributes(
				['class'],
				[
					{ class: 'a', viewBox: '0 0 16 16' },
					{ class: 'b', viewBox: '0 0 24 24' },
				],
			),
		).toEqual({ class: 'a b', viewBox: '0 0 24 24' });
	});

	test('should handle more than two objects', () => {
		expect(
			mergeAttributes(
				['class'],
				[{ class: 'a' }, { class: 'b' }, { class: 'c' }],
			),
		).toEqual({ class: 'a b c' });
	});

	test('should skip empty-string values for merge keys', () => {
		expect(mergeAttributes(['class'], [{ class: 'a' }, { class: '' }])).toEqual(
			{ class: 'a' },
		);
	});
});

describe('processXMLIcon()', () => {
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
