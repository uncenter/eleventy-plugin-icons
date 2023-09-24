import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

import { Icon } from '../src/icon';
import { mergeOptions } from '../src/options';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

test('should match content from filesystem', async () => {
	const icons = join(__dirname, './live/node_modules/lucide-static/icons');
	const options = mergeOptions({
		mode: 'inline',
		sources: [
			{
				name: 'lucide',
				path: icons,
			},
		],
	});
	expect(await new Icon('lucide:star', options).content(options)).toEqual(
		await readFile(join(icons, 'star.svg'), 'utf-8'),
	);
});

test('should accept and parse various attribute types', async () => {
	// {% icon "lucide:star", stroke="#ed8a19", class="starry-night" %}
	// {% icon "lucide:star", '{ "stroke": "#ed8a19", "class": "starry-night" }' %}
	// {% icon "lucide:star", { "stroke": "#ed8a19", "class": "starry-night" } %}
	const icons = join(__dirname, './live/node_modules/lucide-static/icons');
	const options = mergeOptions({
		mode: 'inline',
		sources: [
			{
				name: 'lucide',
				path: icons,
			},
		],
	});
	expect(await new Icon('lucide:star', options).content(options)).toEqual(
		await readFile(join(icons, 'star.svg'), 'utf-8'),
	);
});