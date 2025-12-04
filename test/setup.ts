import type { Options } from '../src/options';
import type { DeepPartial } from '../src/types';

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Eleventy from '@11ty/eleventy';
import pluginIcons from '../src/index';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const TEST_DIR = __dirname;
export const FIXTURE_DIR = join(__dirname, 'fixtures/');
export const EXAMPLE_DIR = join(__dirname, '../examples');

export const withFixture = (name: string) => join(FIXTURE_DIR, name);
export const withExample = (name: string) => join(EXAMPLE_DIR, name);

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

export const getFixtureResultsWithOptions = async (
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

export const getExampleResultsWithOptions = async (
	example: string,
	options: DeepPartial<Options>,
): Promise<EleventyPageResult[]> => {
	const elev = new Eleventy(withExample(example), '_site', {
		config: (eleventyConfig: any) => {
			eleventyConfig.addGlobalData('layout', 'layout.njk');
			eleventyConfig.addPlugin(pluginIcons, options);
		},
	});

	return await elev.toJSON();
};
