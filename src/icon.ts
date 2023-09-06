import path from 'node:path';
import fs from 'node:fs/promises';
import memoize from 'just-memoize';
import { log } from './utils';

import { type Options } from './options';

export type IconObject = { name: string; source: string };

export class Icon {
	public name: string = '';
	public source: string = '';
	public path: string = '';

	constructor(input: IconObject | string, options: Options) {
		if (typeof input === 'object') {
			this.name = input.name;
			this.source = input.source;
		} else if (typeof input === 'string') {
			if (!input.includes(options.icon.delimiter)) {
				this.name = input;
				this.source = options.sources.find((source) => source.default === true)?.name || '';
				if (!this.source)
					log.error(`Icon '${input}' lacks a delimiter and no default source is set.`);
			} else {
				const [source, icon] = input.split(options.icon.delimiter);
				this.name = icon;
				this.source = source;
			}
		} else {
			log.error(`Invalid input type for Icon constructor: '${typeof input}'.`);
		}

		const sourceObject = options.sources.find((source) => source.name === this.source);
		if (sourceObject) {
			this.path = path.join(sourceObject.path, `${this.name}.svg`);
		} else {
			log.error(`Source '${this.source}' is not defined in options.sources.`);
		}
	}

	repr = () => JSON.stringify(this, undefined, 4);

	/**
	 * Retrieves the content of the SVG icon.
	 */
	content = memoize(async (options: Options) => {
		try {
			let content = await fs.readFile(this.path, 'utf-8');
			if (!content) {
				log.warn(`Icon ${this.repr()} appears to be empty.`);
				content = '';
			}
			return options.icon.transform ? await options.icon.transform(content) : content;
		} catch {
			log[options.icon.errorNotFound ? 'error' : 'warn'](`Icon ${this.repr()} not found.`);
		}
	});
}
