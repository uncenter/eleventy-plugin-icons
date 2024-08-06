import type { Options } from './options';
import type { Attributes, DeepPartialObject, Prettify } from './types';

import fs from 'node:fs/promises';
import path from 'node:path';

import memoize from 'just-memoize';

import { Icon, createSprite, getExtraIcons } from './icon';
import { mergeOptions, validateOptions } from './options';
import { parseSVG } from './svg';
import { attributesToString, mergeAttributes } from './utils';

export default function (
	eleventyConfig: any,
	opts: Prettify<DeepPartialObject<Options>>,
) {
	const usedIcons: Icon[] = [];

	if (opts === null || typeof opts !== 'object')
		throw new Error(`options: expected an object but received ${typeof opts}`);
	const options = mergeOptions(opts as Options);
	validateOptions(options);

	eleventyConfig.addAsyncShortcode(
		options.icon.shortcode,
		memoize(async function (
			this: { page: { icons: Icon[] } },
			input: any,
			attrs: Attributes | string = {},
		) {
			const icon = new Icon(input, options);

			// Keep track of used icons for generating sprite.
			usedIcons.push(icon);

			const content = await icon.content(options);
			if (!content) return '';

			switch (typeof attrs) {
				case 'string': {
					attrs = JSON.parse(attrs || '{}') as Attributes;
					break;
				}
				case 'object': {
					// Nunjucks inserts an __keywords key when kwargs are used (https://github.com/mozilla/nunjucks/blob/ea0d6d5396d39d9eed1b864febb36fbeca908f23/nunjucks/src/runtime.js#L123).
					if (attrs['__keywords' as keyof typeof attrs]) {
						delete attrs['__keywords' as keyof typeof attrs];
					}
					break;
				}
			}

			const attributes = mergeAttributes(
				['class', 'id'],
				[
					attrs,
					{ class: options.icon.class(icon.name, icon.source) },
					options.icon.attributes || {},
					options.icon.attributesBySource[icon.source] || {},
				],
			);

			if (options.mode === 'inline') {
				return parseSVG(
					content,
					attributes,
					options.icon.overwriteExistingAttributes,
				);
			} else if (options.mode === 'sprite') {
				if (this.page) {
					if (this.page?.icons === undefined) this.page.icons = [];
					if (!this.page.icons.includes(icon)) this.page.icons.push(icon);
				}
				return `<svg ${attributesToString(
					attributes,
				)}><use href="#${options.icon.id(
					icon.name,
					icon.source,
				)}"></use></svg>`;
			}
		}),
	);

	eleventyConfig.addShortcode(
		options.sprite.shortcode,
		async function (this: { page: { icons: Icon[] } }) {
			return await createSprite(
				[...(this?.page?.icons || []), ...(await getExtraIcons(options))],
				options,
			);
		},
	);

	if (typeof options.sprite.writeFile === 'string') {
		eleventyConfig.on(
			'eleventy.after',
			async ({
				dir,
			}: {
				dir: {
					input: string;
					output: string;
				};
			}) => {
				const sprite = await createSprite(
					[...usedIcons, ...(await getExtraIcons(options))],
					options,
				);
				const file = path.join(dir.output, options.sprite.writeFile as string);
				const fileDirectory = path.parse(file).dir;
				try {
					await fs.readdir(fileDirectory);
				} catch {
					await fs.mkdir(fileDirectory, { recursive: true });
				}
				await fs.writeFile(file, sprite);
			},
		);
	}

	for (const source of options.sources) {
		eleventyConfig.addWatchTarget(source.path);
	}
}
