import type { Options } from '../src/options';
import type { DeepPartial } from '../src/types';

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Eleventy from '@11ty/eleventy';
import extend from 'just-extend';
import pluginIcons from '../src/index';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const TEST_DIR = __dirname;
export const FIXTURE_DIR = join(__dirname, 'fixtures/');

export const withFixture = (name: string) => join(FIXTURE_DIR, name);

export const getFixtureContentFromURL = (
	results: Array<EleventyPageResult>,
	url: string,
): string => {
	const fixture = getFixtureFromURL(results, url);

	return fixture.content.trim();
};

const getFixtureFromURL = (
	results: Array<EleventyPageResult>,
	url: string,
): EleventyPageResult => {
	const fixture = results.find((result) => result.url === url);
	if (fixture) return fixture;
	throw new Error(`Fixture '${url}' does not exist`);
};

type EleventyPageResult = {
	url: string;
	inputPath: string;
	outputPath: string;
	rawInput: string;
	content: string;
};

export const getResultsWithOptions = async (
	fixture: string,
	options: DeepPartial<Options>,
): Promise<EleventyPageResult[]> => {
	const elev = new Eleventy(withFixture(fixture), '_site', {
		config: (eleventyConfig: any) => {
			eleventyConfig.addPlugin(pluginIcons, options);
		},
	});

	return await elev.toJSON();
};

export const combineOptions = (
	additionalOptions?: DeepPartial<Options>,
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
