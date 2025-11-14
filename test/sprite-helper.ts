import Eleventy from '@11ty/eleventy';
import extend from 'just-extend';

import pluginIcons from '../src/index';
import { withFixture } from './utils';

export const buildEleventy = (fixture: string, options: any) => {
	const config = buildConfig();

	return new Eleventy(withFixture(fixture), '_site', config);

	function buildConfig(): any {
		return {
			config: (eleventyConfig: any) => {
				eleventyConfig.addPlugin(pluginIcons, options);
			},
		};
	}
};

export const buildOptions = (
	additionalOptions?: Record<string, unknown>,
): any => {
	const options: any = {
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

	extend(true, options, additionalOptions);

	return options;
};
