import Eleventy from '@11ty/eleventy';
import { bench } from 'vitest';

import pluginIcons from '../../src/index';

import { withExample } from '../utils';

bench('sync', async () => {
	const elev = new Eleventy(withExample('sprite'), '_site', {
		config: (eleventyConfig: any) => {
			eleventyConfig.addPlugin(pluginIcons, {
				mode: 'sprite',
				sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
				sprite: {
					extraIcons: {
						all: true,
					},
				},
			});
		},
	});
	const results = await elev.toJSON();
});

bench('async', async () => {
	const elev = new Eleventy(withExample('sprite'), '_site', {
		config: (eleventyConfig: any) => {
			eleventyConfig.addPlugin(pluginIcons, {
				mode: 'sprite',
				sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
				icon: {
					shortcode: 'iconSync',
					shortcodeAsync: 'icon',
				},
				sprite: {
					shortcode: 'spriteSheetSync',
					shortcodeAsync: 'spriteSheet',
					extraIcons: {
						all: true,
					},
				},
			});
		},
	});
	const results = await elev.toJSON();
});
