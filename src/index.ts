import type { Options } from './options';
import type { Attributes, DeepPartial, Prettify } from './types';

import fs from 'node:fs/promises';
import path from 'node:path';

import {
	createSprite,
	createSpriteReference,
	getExtraIcons,
	Icon,
} from './icon';
import { mergeOptions, validateOptions } from './options';
import { processXMLIcon } from './svg';

export default function (
	eleventyConfig: any,
	opts: Prettify<DeepPartial<Options>>,
) {
	const usedIcons: Icon[] = [];
	let extraIcons: Icon[] | undefined;

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
			const icon = new Icon(input, options, attrs);

			// Keep track of used icons for generating sprite.
			usedIcons.push(icon);

			const content = await icon.content(options);
			if (!content) return '';

			switch (options.mode) {
				case 'inline':
					return processXMLIcon(
						icon.path,
						content,
						icon.attributes,
						options.icon.overwriteExistingAttributes,
					);
				case 'sprite':
					if (this.page) {
						if (this.page?.icons === undefined) this.page.icons = [];
						if (!this.page.icons.includes(icon)) this.page.icons.push(icon);
					}
					return createSpriteReference(
						icon.attributes,
						options.icon.id(icon.name, icon.source),
						getSvgSpriteUrl(),
					);
			}
		},
	);

	eleventyConfig.addShortcode(
		options.sprite.shortcode,
		async function (this: { page: { icons: Icon[] } }) {
			return await createSpriteWithExtraIcons(this?.page?.icons || []);
		},
	);

	const getSvgSpriteUrl = (): string | undefined => {
		if (typeof options.sprite.writeFile === 'string') {
			return `/${pathToUrl(options.sprite.writeFile)}`;
		}
	};

	eleventyConfig.addShortcode('getSvgSpriteUrl', (): string => {
		if (options.mode === 'inline') {
			throw new Error(
				"The 'getSvgSpriteUrl' shortcode can only be used in 'sprite' mode.",
			);
		}

		const url = getSvgSpriteUrl();
		if (url === undefined) {
			throw new Error(
				"The 'getSvgSpriteUrl' shortcode can only be used when 'sprite.writeFile' is defined.",
			);
		}

		return url;
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
				const sprite = await createSpriteWithExtraIcons(usedIcons);

				const outputFilePath = path.join(
					dir.output,
					pathToUrl(options.sprite.writeFile as string),
				);
				const outputFileDirectory = path.parse(outputFilePath).dir;

				try {
					await fs.readdir(outputFileDirectory);
				} catch {
					await fs.mkdir(outputFileDirectory, { recursive: true });
				}
				await fs.writeFile(outputFilePath, sprite);
			},
		);
	}

	for (const source of options.sources) {
		eleventyConfig.addWatchTarget(source.path);
	}

	const createSpriteWithExtraIcons = async (icons: Icon[]) => {
		extraIcons ??= await getExtraIcons(options);

		return await createSprite(icons.concat(extraIcons), options);
	};

	const pathToUrl = (p: string): string =>
		path.normalize(p).split(path.sep).join('/');
}
