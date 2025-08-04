import type { Options } from './options';
import type { Attributes } from './types';

import fs from 'node:fs/promises';
import path from 'node:path';

import memoize from 'just-memoize';

import { parseSVG } from './svg';
import { attributesToString, log, stringify } from './utils';

export class Icon {
	public name = '';
	public source = '';
	public path = '';

	constructor(
		input: { name: string; source: string } | string,
		options: Options,
	) {
		if (typeof input === 'object') {
			this.name = input.name;
			this.source = input.source;
		} else if (typeof input === 'string') {
			if (input.includes(options.icon.delimiter)) {
				const [source, icon] = input.split(options.icon.delimiter);
				this.name = icon;
				this.source = source;
			} else {
				this.name = input;
				this.source =
					options.sources.find((source) => source.default === true)?.name || '';
				if (!this.source)
					log.error(
						`Icon '${input}' lacks a delimiter and no default source is set.`,
					);
			}
		} else {
			log.error(`Invalid input type for Icon constructor: '${typeof input}'.`);
		}

		const sourceObject = options.sources.find(
			(source) => source.name === this.source,
		);
		if (sourceObject) {
			const fileName = sourceObject?.getFileName
				? sourceObject.getFileName(this.name)
				: `${this.name}.svg`;
			this.path = path.join(sourceObject.path, fileName);
		} else {
			log.error(`Source '${this.source}' is not defined in options.sources.`);
		}
	}

	stringified = () => stringify(this);

	// eslint-disable-next-line unicorn/consistent-function-scoping
	content = memoize(async (options: Options) => {
		try {
			let content = await fs.readFile(this.path, 'utf-8');
			if (!content) {
				log.warn(`Icon ${this.stringified()} appears to be empty.`);
				content = '';
			}
			return options.icon.transform
				? await options.icon.transform(content)
				: content;
		} catch {
			log[options.icon.errorNotFound ? 'error' : 'warn'](
				`Icon ${this.stringified()} not found.`,
			);
		}
	});
}

export const createSprite = memoize(
	async (icons: Icon[], options: Options): Promise<string> => {
		// Create an array of promises that generate symbol definitions for each icon.
		const symbols = await Promise.all(
			[...new Set(icons || [])].map(async (icon) => {
				const content = await icon.content(options);
				// If content exists, convert it to a symbol element and add attributes.
				if (content) {
					return parseSVG(
						content,
						{ id: options.icon.id(icon.name, icon.source) },
						true,
					)
						.replace(/<svg/, '<symbol')
						.replace(/<\/svg>/, '</symbol>');
				}
				return '';
			}),
		);

		// Combine the generated symbol strings and filter out empty ones.
		const symbolsString = [...new Set(symbols.filter(Boolean))].join('');
		return symbolsString
			? `<svg ${attributesToString(
					options.sprite.attributes,
				)}><defs>${symbolsString}</defs></svg>`
			: ''; // Return an empty string if no symbols were generated.
	},
);

export const getExtraIcons = async (options: Options): Promise<Icon[]> => {
	const icons = [];
	const sources = [];

	if (options.sprite.extraIcons.all === true) {
		sources.push(...options.sources);
	} else {
		if (Array.isArray(options.sprite.extraIcons.sources)) {
			for (const name of options.sprite.extraIcons.sources) {
				const source = options.sources.find((source) => source.name === name);
				if (source) {
					sources.push(source);
				} else {
					log.error(
						`options.sprite.extraIcons.sources: Source '${name}' is not defined in options.sources.`,
					);
				}
			}
		}
		if (Array.isArray(options.sprite.extraIcons.icons)) {
			for (const icon of options.sprite.extraIcons.icons) {
				if (!icon.name || !icon.source)
					log.error(
						`options.sprite.extraIcons.icons: Invalid icon: ${JSON.stringify(
							icon,
						)}.`,
					);
				icons.push(new Icon(icon, options));
			}
		}
	}

	for (const source of sources) {
		for (const file of await fs.readdir(source.path)) {
			if (file.endsWith('.svg')) {
				icons.push(
					new Icon(
						{
							name: file.replace('.svg', ''),
							source: source.name,
						},
						options,
					),
				);
			}
		}
	}
	return icons;
};

export const createSpriteReference = (
	attributes: Attributes,
	id: string,
): string => {
	return `<svg ${attributesToString(
		attributes,
	)}><use href="#${id}"></use></svg>`;
};
