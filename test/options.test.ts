import { expect, test } from 'vitest';
import { defaultOptions, validateOptions } from '../src/options';

test('default options are valid', () => {
	let valid = false;
	try {
		validateOptions(defaultOptions);
		valid = true;
	} catch (e) {
		throw e;
	}
	expect(valid).toBe(true);
});
