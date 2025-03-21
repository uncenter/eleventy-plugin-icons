import type { Options } from './options';
import type { Attributes, DeepPartial, Prettify } from './types';

import fs from 'node:fs/promises';
import path from 'node:path';

import memoize from 'just-memoize';

import {
	Icon,
	createSprite,
	createSpriteReference,
	getExtraIcons,
} from './icon';
import { mergeOptions, validateOptions } from './options';
import { parseSVG } from './svg';
import { handleIconShortcodeAttributes } from './utils';

export default function (
	eleventyConfig: any,
	opts: Prettify<DeepPartial<Options>>,
) {
	const usedIcons: Icon[] = [];

	if (opts === null || typeof opts !== 'object')
		throw new Error(`options: expected an object but received ${typeof opts}`);
	const options = mergeOptions(opts as Options);
	validateOptions(options);

	eleventyConfig.addAsyncShortcode(
		options.icon.shortcode,
		async function (
			this: { page: { icons: Icon[] } },
			input: any,
			attrs: Attributes | string = {},
		) {
			const icon = new Icon(input, options);

			// Keep track of used icons for generating sprite.
			usedIcons.push(icon);

			const content = await icon.content(options);
			if (!content) return '';

			const attributes = handleIconShortcodeAttributes(attrs, options, icon);

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
				return createSpriteReference(
					attributes,
					options.icon.id(icon.name, icon.source),
				);
			}
		},
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
