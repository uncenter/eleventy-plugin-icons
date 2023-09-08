import { describe, expect, test } from 'vitest';
import { defaultOptions, validateOptions } from '../src/options';

describe('validateOptions()', () => {
	test('should validate default options', () => {
		let valid = false;
		try {
			validateOptions(defaultOptions);
			valid = true;
		} catch {}
		expect(valid).toBe(true);
	});

	test('should invalidate empty options', () => {
		let valid;
		try {
			// @ts-ignore
			validateOptions({});
			valid = true;
		} catch {
			valid = false;
		}
		expect(valid).toBe(false);
	});

	test('should throw error for invalid property type', () => {
		let valid;
		try {
			// @ts-ignore
			validateOptions({ ...defaultOptions, mode: false });
			valid = true;
		} catch {
			valid = false;
		}
		expect(valid).toBe(false);
	});
});
