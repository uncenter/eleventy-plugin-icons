import Eleventy from '@11ty/eleventy';
import { expect, test } from 'vitest';

import pluginIcons from '../';

import { getFixtureFromURL, withFixture } from './utils';

const elev = new Eleventy(withFixture('sprite'), '_site', {
	config: function (eleventyConfig: any) {
		eleventyConfig.addPlugin(pluginIcons, {
			mode: 'sprite',
			sources: [
				{
					name: 'custom',
					path: 'test/fixtures/icons',
					default: true,
					getFileName: (icon: string) => 'icon-' + icon + '.svg',
				},
				{ name: 'lucide', path: 'node_modules/lucide-static/icons' },
			],
			icon: {
				shortcode: 'sprite',
				errorNotFound: false,
			},
		});
	},
});

const results = await elev.toJSON();

test('a spritesheet should be created with at least one icon on the page', () => {
	const file = getFixtureFromURL(results, '/spritesheet/')!.content;

	expect(file).toContain(
		`<svg class="icon icon-star"><use href="#icon-star"></use></svg>`,
	);
	expect(
		file,
	).toContain(`<svg class="sprite-sheet" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs>
<!-- @license lucide-static v0.407.0 - ISC -->
<symbol class="lucide lucide-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="icon-star">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</symbol></defs></svg>`);
});

test('a spritesheet should NOT be created with zero icons on the page', () => {
	const file = getFixtureFromURL(results, '/empty-spritesheet/')!.content;

	expect(file.trim()).toBe(``);
});
