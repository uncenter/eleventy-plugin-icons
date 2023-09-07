import memoize from 'just-memoize';
import fs from 'node:fs/promises';
import path from 'node:path';

import { attributesToString, mergeAttributes, parseSVG } from './utils';
import { mergeOptions, validateOptions, type Options } from './options';
import { Icon, createSprite, getExtraIcons } from './icon';

import type { Attributes } from './types';

export default function (eleventyConfig: any, opts: Options) {
	const usedIcons: Icon[] = [];

	const options = mergeOptions(opts);
	validateOptions(options);

	eleventyConfig.addAsyncShortcode(
		options.icon.shortcode,
		memoize(async (input: any, attrs: Attributes | string = {}) => {
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
				return parseSVG(content, attributes, options.icon.overwriteExistingAttributes);
			} else if (options.mode === 'sprite') {
				return `<svg ${attributesToString(attributes)}><use href="#${options.icon.id(
					icon.name,
					icon.source,
				)}"></use></svg>`;
			}
		}),
	);

	eleventyConfig.addShortcode(options.sprite.shortcode, async function () {
		// @ts-expect-error
		return await createSprite(this?.page?.icons);
	});

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
				const fileDir = path.parse(file).dir;
				try {
					await fs.readdir(fileDir);
				} catch {
					await fs.mkdir(fileDir, { recursive: true });
				}
				await fs.writeFile(file, sprite);
			},
		);
	}

	options.sources.forEach((source) => {
		eleventyConfig.addWatchTarget(source.path);
	});
}
