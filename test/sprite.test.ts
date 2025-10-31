import { expect, test } from 'vitest';

import { buildEleventy, buildOptions } from './sprite-helper';
import { getFixtureContentFromURL } from './utils';

const fixtureFolder = 'sprite';

const elev = buildEleventy(fixtureFolder, buildOptions());

const results = await elev.toJSON();

test('a spritesheet should be created with at least one icon on the page', () => {
	const file = getFixtureContentFromURL(results, '/spritesheet/');

	expect(file).toContain(
		`<svg class="icon icon-star"><use href="#icon-star"></use></svg>`,
	);
	expect(
		file,
	).toContain(`<svg class="sprite-sheet" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs>
<!-- @license lucide-static v0.483.0 - ISC -->
<symbol class="lucide lucide-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="icon-star">
  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
</symbol></defs></svg>`);
});

test('a spritesheet should NOT be created with zero icons on the page', () => {
	const file = getFixtureContentFromURL(results, '/empty-spritesheet/');

	expect(file).toBe('');
});
