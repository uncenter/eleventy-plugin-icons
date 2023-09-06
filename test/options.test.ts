import { expect, test } from 'vitest';
import { defaultOptions, validateOptions } from '../src/options';

test('default options are valid', () => {
	let valid = false;
	try {
		validateOptions(defaultOptions);
		valid = true;
	} catch {}
	expect(valid).toBe(true);
});

test('empty options are invalid', () => {
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

test('invalid options throw error', () => {
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
