import { bench } from 'vitest';

import { getExampleResultsWithOptions } from '../setup';

bench('inline example', async () => {
	await getExampleResultsWithOptions('inline', {
		mode: 'inline',
		sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
	});
});

bench('sprite example', async () => {
	await getExampleResultsWithOptions('sprite', {
		mode: 'sprite',
		sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
	});
});

bench('sprite example (all icons)', async () => {
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

bench('sprite example (writeFile)', async () => {
	await getExampleResultsWithOptions('sprite_writeFile', {
		mode: 'sprite',
		sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
		sprite: {
			writeFile: 'assets/icons/sprites.svg',
		},
	});
});
