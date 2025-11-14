import { describe, expect, test } from 'vitest';

import { buildEleventy, buildOptions } from './sprite-helper';
import { getFixtureContentFromURL } from './utils';

const fixtureFolder = 'sprite-external';

describe('supports external svg reference', () => {
	test('when writeFile is set', async () => {
		const pluginOptions = buildOptions({
			sprite: {
				writeFile: 'assets/icons/sprites.svg',
			},
		});
		const elev = buildEleventy(fixtureFolder, pluginOptions);

		const results = await elev.toJSON();
		const file = getFixtureContentFromURL(results, '/external-reference/');

		expect(file).toBe(
			'<svg class="icon icon-apple"><use href="/assets/icons/sprites.svg#icon-apple"></use></svg>',
		);
	});
});
