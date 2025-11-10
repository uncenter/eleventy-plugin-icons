import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const TEST_DIR = __dirname;
export const FIXTURE_DIR = join(TEST_DIR, 'fixtures/');
export const EXAMPLE_DIR = join(TEST_DIR, '../examples');

export const withFixture = (name: string) => join(FIXTURE_DIR, name);
export const withExample = (name: string) => join(EXAMPLE_DIR, name);
export const getFixtureFromURL = (
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
