import type { Options } from './options';
import type { Attributes } from './types';

import fs from 'node:fs/promises';
import path from 'node:path';

import { cache } from './cache';
import { processXMLIcon } from './svg';
import {
	attributesToString,
	handleIconShortcodeAttributes,
	log,
	stringify,
} from './utils';

export class Icon {
	public name = '';
	public source = '';
	public path = '';
	public attributes: Attributes = {};
	public id = '';

	constructor(
		input: { name: string; source: string } | string,
		options: Options,
		attributes: Attributes | string,
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

		this.attributes = handleIconShortcodeAttributes(attributes, options, this);

		this.id = `${this.path}-${JSON.stringify(this.attributes)}`;
	}

	stringified = () => stringify(this);

	// eslint-disable-next-line unicorn/consistent-function-scoping
	content = async (options: Options): Promise<string> => {
		const iconContentKey = `iconContent-${this.path}`;

		const maybe = cache.get(iconContentKey);
		if (maybe !== undefined) return maybe;

		let content: string;

		try {
			let fromFile = await fs.readFile(this.path, 'utf-8');

			if (!fromFile) {
				log.warn(`Icon ${this.stringified()} appears to be empty.`);
				fromFile = '';
			}

			content = options.icon.transform
				? await options.icon.transform(fromFile)
				: fromFile;
		} catch {
			log[options.icon.errorNotFound ? 'error' : 'warn'](
				`Icon ${this.stringified()} not found.`,
			);

			content = '';
		}

		cache.set(iconContentKey, content);
		return content;
	};
}

export const createSprite = async (
	icons: Icon[],
	options: Options,
): Promise<string> => {
	// Sort icons for consistent ordering.
	icons.sort((a, b) => (a.path < b.path ? -1 : 1));

	const dedupedIcons = new Map(icons.map((item) => [item.path, item]));
	const dedupedIds = [...dedupedIcons.keys()];

	const combinedSpritesKey = `sprites-${dedupedIds.join('/')}`;

	const maybe = cache.get(combinedSpritesKey);
	if (maybe !== undefined) return maybe;

	const symbols: string[] = [];

	for (const [path, icon] of dedupedIcons.entries()) {
		const symbolKey = `symbol-${path}`;

		const maybe = cache.get(symbolKey);
		if (maybe !== undefined) {
			symbols.push(maybe);
			continue;
		}

		const content = await icon.content(options);

		if (content === '') {
			continue;
		}

		// If content exists, convert it to a symbol element and add attributes.
		const processed = processXMLIcon(
			icon.path,
			content,
			{ id: options.icon.id(icon.name, icon.source) },
			true,
		)
			.replace(/<svg/, '<symbol') // TODO: Avoid regex for changing tags.
			.replace(/<\/svg>/, '</symbol>');

		cache.set(symbolKey, processed);
		symbols.push(processed);
	}

	// Return an empty string if no symbols were generated.
	if (symbols.length === 0) {
		return '';
	}

	// Combine the generated symbol strings.
	const content = `<svg ${attributesToString(
		options.sprite.attributes,
	)}><defs>${symbols.join('')}</defs></svg>`;

	cache.set(combinedSpritesKey, content);

	return content;
};

export const getExtraIcons = async (options: Options): Promise<Icon[]> => {
	const icons = [];
	const sources = [];

	if (options.sprite.extraIcons.all === true) {
		sources.push(...options.sources);
	} else {
		for (const source of options.sprite.extraIcons.sources) {
			const match = options.sources.find(({ name }) => name === source);
			if (match) {
				sources.push(match);
			} else {
				log.error(
					`options.sprite.extraIcons.sources: Source '${source}' is not defined in options.sources.`,
				);
			}
		}

		for (const icon of options.sprite.extraIcons.icons) {
			if (sources.some((source) => source.name === icon.source)) {
				log.warn(
					`options.sprite.extraIcons.icons: icons from source '${icon.source}' already included from options.sprite.extraIcons.sources: ${JSON.stringify(
						icon,
					)}.`,
				);
			} else {
				icons.push(new Icon(icon, options, {}));
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
						{},
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
	spriteUrl: string | undefined,
): string => {
	return `<svg ${attributesToString(
		attributes,
	)}><use href="${spriteUrl ?? ''}#${id}"></use></svg>`;
};
