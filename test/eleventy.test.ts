import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { FIXTURES_DIR } from './constants';

function getFixture(mode: 'inline' | 'sprite', fixture: string) {
	return readFileSync(
		join(FIXTURES_DIR, '_site', mode, fixture, 'index.html'),
		'utf-8',
	);
}

describe('inline', () => {
	test('various attribute formats should be indentically used', () => {
		const file = getFixture('inline', 'attribute-formats');

		expect(file.trim()).toBe(`<!-- @license lucide-static v0.303.0 - ISC -->
<svg class="starry-night icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed8a19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>

<!-- @license lucide-static v0.303.0 - ISC -->
<svg class="starry-night icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed8a19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>

<!-- @license lucide-static v0.303.0 - ISC -->
<svg class="starry-night icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed8a19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`);
	});

	test('icons with XML declarations and comments should be parsed correctly', () => {
		const file = getFixture('inline', 'xml');

		expect(file.trim()).toBe(`This is an empty icon:

This one has a few comments that should be preserved in the output:

<!-- A comment!  -->
<svg xmlns="http://www.w3.org/2000/svg" version="1" class="icon icon-xml-comment">
  <!-- Another comment!  -->
</svg>
<!-- Last comment!  -->
This one has an XML doctype that should be removed:

<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-xml-doctype"/>`);
	});
});

describe('sprite', () => {
	test('a spritesheet should be created with at least one icon on the page', () => {
		const file = getFixture('sprite', 'spritesheet');

		expect(file.trim()).toBe(`<!-- @license lucide-static v0.303.0 - ISC -->
<svg class="icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`);
	});

	test('a spritesheet should NOT be created with zero icons on the page', () => {
		const file = getFixture('sprite', 'empty-spritesheet');

		expect(file.trim()).toBe(``);
	});
});
