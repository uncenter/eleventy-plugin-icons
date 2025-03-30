import Eleventy from '@11ty/eleventy';
import { expect, test } from 'vitest';

import pluginIcons from '../src/index';

import { getFixtureFromURL, withFixture } from './utils';

const elev = new Eleventy(withFixture('inline'), '_site', {
	config: (eleventyConfig: any) => {
		eleventyConfig.addPlugin(pluginIcons, {
			mode: 'inline',
			sources: [
				{
					name: 'custom',
					path: 'test/fixtures/icons',
					default: true,
					getFileName: (icon: string) => `icon-${icon}.svg`,
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
	)?.content.trim();

	expect(
		file,
	).toContain(`<svg class="starry-night icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed8a19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
</svg>`);

	expect(
		file,
	).toContain(`<svg class="starry-night icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed8a19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
</svg>`);

	expect(
		file,
	).toContain(`<svg class="starry-night icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed8a19" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
</svg>`);
});

test('icons with XML declarations and comments should be parsed correctly', () => {
	const file = getFixtureFromURL(results, '/xml/')?.content.trim();

	expect(file).toBe(`This is an empty icon:

This one has a few comments that should be preserved in the output:

<!-- A comment!  -->
<svg xmlns="http://www.w3.org/2000/svg" version="1" class="icon icon-xml-comment">
  <!-- Another comment!  -->
</svg>
<!-- Last comment!  -->
This one has an XML doctype that should be removed:

<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-xml-doctype"/>`);
});
