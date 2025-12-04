import { bench, describe } from 'vitest';

import { getExampleResultsWithOptions } from '../setup';

bench('inline mode', async () => {
	await getExampleResultsWithOptions('inline', {
		mode: 'inline',
		sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
	});
});

bench('sprite mode', async () => {
	await getExampleResultsWithOptions('sprite', {
		mode: 'sprite',
		sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
	});
});

describe('sprite mode options', () => {
	bench('including all (lucide) icons', async () => {
		await getExampleResultsWithOptions('sprite', {
			mode: 'sprite',
			sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
			sprite: {
				extraIcons: {
					all: true,
				},
			},
		});
	});

	bench('with writeFile defined', async () => {
		await getExampleResultsWithOptions('sprite_writeFile', {
			mode: 'sprite',
			sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
			sprite: {
				writeFile: 'assets/icons/sprites.svg',
			},
		});
	});
});
