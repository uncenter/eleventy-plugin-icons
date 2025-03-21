import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const TEST_DIR = __dirname;
export const FIXTURE_DIR = join(__dirname, 'fixtures/');

export const withFixture = (name: string) => join(FIXTURE_DIR, name);
export const getFixtureFromURL = (
	results: Array<EleventyPageResult>,
	url: string,
) => results.find((result) => result.url === url);

type EleventyPageResult = {
	url: string;
	inputPath: string;
	outputPath: string;
	rawInput: string;
	content: string;
};
