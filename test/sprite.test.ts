import fs from 'node:fs/promises';
import path from 'node:path';

import merge from 'merge';
import { describe, expect, test } from 'vitest';

import {
	getFixtureContentFromURL,
	getFixtureResultsWithOptions,
} from './setup';

const SPRITE_OPTIONS: any = {
	mode: 'sprite',
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
		shortcode: 'sprite',
		errorNotFound: false,
	},
};

const results = await getFixtureResultsWithOptions('sprite', SPRITE_OPTIONS);

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

describe('supports external svg reference', () => {
	const outputSpriteDirectory = path.join(import.meta.dirname, '_site_sprite');

	test('when writeFile is set', async () => {
		const results = await getFixtureResultsWithOptions(
			'sprite-external',
			merge.recursive(true, SPRITE_OPTIONS, {
				sprite: {
					writeFile: 'assets/icons/sprites.svg',
				},
			}),
			outputSpriteDirectory,
		);
		const file = getFixtureContentFromURL(results, '/external-reference/');

		expect(file).toMatchSnapshot();
	});

	test('when writeToDirectory is set', async () => {
		const results = await getFixtureResultsWithOptions(
			'sprite-external',
			merge.recursive(true, SPRITE_OPTIONS, {
				sprite: {
					writeToDirectory: 'assets/icons',
				},
			}),
			outputSpriteDirectory,
		);

		const file = getFixtureContentFromURL(results, '/external-reference/');

		expect(file).toMatchSnapshot();

		expect(
			await fs.readFile(
				path.join(outputSpriteDirectory, 'assets/icons/ieV1V-ezXX.svg'),
				'utf-8',
			),
		).toMatchSnapshot();
	});
});
