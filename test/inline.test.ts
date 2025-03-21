import Eleventy from '@11ty/eleventy';
import { expect, test } from 'vitest';

import pluginIcons from '../';

import { getFixtureFromURL, withFixture } from './utils';

const elev = new Eleventy(withFixture('inline'), '_site', {
	config: function (eleventyConfig: any) {
		eleventyConfig.addPlugin(pluginIcons, {
			mode: 'inline',
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
				shortcode: 'inline',
				errorNotFound: false,
			},
		});
	},
});

const results = await elev.toJSON();

test('various attribute formats should be indentically used', () => {
	const file = getFixtureFromURL(
		results,
		'/attribute-formats/',
	)!.content.trim();

	expect(
		file,
	).toContain(`<svg class="starry-night icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed8a19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`);

	expect(
		file,
	).toContain(`<svg class="starry-night icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed8a19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`);

	expect(
		file,
	).toContain(`<svg class="starry-night icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed8a19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`);
});

test('icons with XML declarations and comments should be parsed correctly', () => {
	const file = getFixtureFromURL(results, '/xml/')!.content.trim();

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
