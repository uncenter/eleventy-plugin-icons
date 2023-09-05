import fs from 'node:fs/promises';
import path from 'node:path';
import memoize from 'just-memoize';

import { attributesToString, combineAttributes, log, mergeOptions, parseSVG } from './utils';
import { Icon } from './icon';

import { type PluginOptions } from './options';
import type { Attributes, IconObject } from './types';

module.exports = function (eleventyConfig: any, opts: PluginOptions) {
	const options = mergeOptions(opts);
	const usedIcons: Icon[] = [];

	const createIcon = memoize((icon: IconObject | string): Icon => new Icon(icon, options));
	/**
	 * Generates a sprite sheet with symbol definitions.
	 * @returns An SVG string representing the generated sprite sheet.
	 */
	const generateSprite = memoize(async (icons: Icon[]): Promise<string> => {
		// Create an array of promises that generate symbol definitions for each icon.
		const symbols = await Promise.all(
			[...new Set(icons || [])].map(async (icon) => {
				const content = await icon.content(options);
				// If content exists, convert it to a symbol element and add attributes.
				if (content) {
					return parseSVG(content, { id: options.icon.id(icon.name, icon.source) }, true)
						.replace(/<svg/, '<symbol')
						.replace(/<\/svg>/, '</symbol>');
				}
				return '';
			}),
		);

		// Combine the generated symbol strings and filter out empty ones.
		const symbolsString = symbols.filter(Boolean).join('');
		return symbolsString
			? `<svg ${attributesToString(options.sprite.attributes)}><defs>${symbolsString}</defs></svg>`
			: ''; // Return an empty string if no symbols were generated.
	});

	/**
	 * Retrieves extra icons based on configuration.
	 * @returns List of extra icons.
	 */
	const extraIcons = async (): Promise<Array<Icon>> => {
		let icons = [];
		let sources = [];

		if (options.sprite.extraIcons.all === true) {
			sources.push(...options.sources);
		} else {
			if (Array.isArray(options.sprite.extraIcons.sources)) {
				options.sprite.extraIcons.sources.forEach((name) => {
					const source = options.sources.find((source) => source.name === name);
					if (!source) {
						log.error(
							`options.sprite.extraIcons.sources: Source '${name}' is not defined in options.sources.`,
						);
					}
					sources.push(source);
				});
			} else if (Array.isArray(options.sprite.extraIcons.icons)) {
				for (const icon of options.sprite.extraIcons.icons) {
					if (!icon.name || !icon.source)
						log.error(`options.sprite.extraIcons.icons: Invalid icon: ${JSON.stringify(icon)}.`);
					icons.push(createIcon(icon));
				}
			}
		}

		for (const source of sources) {
			for (const file of await fs.readdir(source.path)) {
				if (file.endsWith('.svg')) {
					icons.push(
						createIcon({
							name: file.replace('.svg', ''),
							source: source.name,
						}),
					);
				}
			}
		}
		return icons;
	};

	if (options.sources.filter((source) => source.default === true).length > 1)
		log.error(`options.sources: Only one default source is allowed.`);

	if ([...new Set(options.sources.map((source) => source.name))].length !== options.sources.length)
		log.error('options.sources: Source names must be unique.');

	eleventyConfig.addAsyncShortcode(
		options.icon.shortcode,
		memoize(async (input: any, attrs: Attributes | string = {}) => {
			const icon = createIcon(input);
			// Keep track of used icons for generating sprite.
			usedIcons.push(icon);

			const content = await icon.content(options);
			if (!content) return '';

			switch (typeof attrs) {
				case 'string': {
					attrs = JSON.parse(attrs || '{}') as Attributes;
				}
				case 'object': {
					// Nunjucks inserts an __keywords key when kwargs are used (https://github.com/mozilla/nunjucks/blob/ea0d6d5396d39d9eed1b864febb36fbeca908f23/nunjucks/src/runtime.js#L123).
					if (attrs['__keywords' as keyof typeof attrs]) {
						delete attrs['__keywords' as keyof typeof attrs];
					}
				}
			}

			const attributes = combineAttributes(
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
		return await generateSprite(this?.page?.icons);
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
				const sprite = await generateSprite([...usedIcons, ...(await extraIcons())]);
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
};
