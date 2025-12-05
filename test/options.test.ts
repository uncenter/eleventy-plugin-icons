import { describe, expect, test } from 'vitest';

import merge from 'merge';

import { defaultOptions, validateOptions } from '../src/options';

describe('validateOptions()', () => {
	test('should validate default options', () => {
		let valid: boolean;
		try {
			validateOptions(defaultOptions);
			valid = true;
		} catch {
			valid = false;
		}
		expect(valid).toBe(true);
	});

	test('should invalidate empty options', () => {
		let valid: boolean;
		try {
			// @ts-expect-error - {} is an invalid type for Options.
			validateOptions({});
			valid = true;
		} catch {
			valid = false;
		}
		expect(valid).toBe(false);
	});

	test('should throw error for invalid property type', () => {
		let valid: boolean;
		try {
			// @ts-expect-error - Options.mode cannot be a boolean.
			validateOptions({ ...defaultOptions, mode: false });
			valid = true;
		} catch {
			valid = false;
		}
		expect(valid).toBe(false);
	});

	test('should throw error when both "writeFile" and "writeToDirectory" are set', () => {
		let valid: boolean;
		try {
			validateOptions(
				merge.recursive(true, defaultOptions, {
					mode: 'sprite',
					sprite: {
						writeFile: 'icons/sprite.svg',
						writeToDirectory: 'icons/',
					},
				}),
			);
			valid = true;
		} catch {
			valid = false;
		}
		expect(valid).toBe(false);
	});
});
