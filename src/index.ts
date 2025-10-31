import type { Options } from './options';
import type { Attributes, DeepPartial, Prettify } from './types';

import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';

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

			switch (options.mode) {
				case 'inline':
					return parseSVG(
						content,
						attributes,
						options.icon.overwriteExistingAttributes,
					);
				case 'sprite':
					if (this.page) {
						if (this.page?.icons === undefined) this.page.icons = [];
						if (!this.page.icons.includes(icon)) this.page.icons.push(icon);
					}
					return createSpriteReference(
						attributes,
						options.icon.id(icon.name, icon.source),
						await getSvgSpriteUrl(),
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

	const getSvgSpriteUrl = async (): Promise<string | undefined> => {
		const filepath = await getFileRelativeUrl(options);

		if (filepath === undefined) {
			return undefined;
		}

		return `/${filepath}`;
	};

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

				const relFileUrl = await getFileRelativeUrl(options);
				assert(typeof relFileUrl === 'string', 'Unexpected type of relFileUrl');

				const outputFilepath = path.join(dir.output, relFileUrl);

				const fileDirectory = path.parse(outputFilepath).dir;
				try {
					await fs.readdir(fileDirectory);
				} catch {
					await fs.mkdir(fileDirectory, { recursive: true });
				}
				await fs.writeFile(outputFilepath, sprite);
			},
		);
	}

	for (const source of options.sources) {
		eleventyConfig.addWatchTarget(source.path);
	}

	const getFileRelativeUrl = async (
		opts: Options,
	): Promise<string | undefined> => {
		if (opts.sprite.writeFile !== false) {
			return pathToUrl(path.join(opts.sprite.writeFile as string));
		}

		return undefined;
	};

	const pathToUrl = (pathStr: string) => pathStr.split(path.sep).join('/');
}
