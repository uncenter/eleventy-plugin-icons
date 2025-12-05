import type { Options } from './options';
import type { Attributes, DeepPartial, Prettify } from './types';

import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';

import { PluginError } from './error';
import { Icon, createSprite, getExtraIcons } from './icon';
import {
	GenerationMode,
	inferGenerationMode,
	mergeOptions,
	validateOptions,
} from './options';
import { processXMLIcon } from './svg';
import { log } from './utils';

const PLACEHOLDER_SVG_SPRITE_URL = '/*__EleventyPluginIconsSpriteUrl__*/';
const PLACEHOLDER_SVG_SPRITE_CONTENT =
	'/*__EleventyPluginIconsSpriteContent__*/';
const PLACEHOLDER_ICON = (id: string) =>
	`/*__EleventyPluginIconsIcon:(${id})__*/`;

export default function (
	eleventyConfig: any,
	opts: Prettify<DeepPartial<Options>>,
) {
	const usedIcons: Map<string, Icon> = new Map<string, Icon>();
	let extraIcons: Icon[] | undefined = undefined;
	let relFileUrl: string | undefined = undefined;
	let hrefPrefix: string | undefined = undefined;

	if (opts === null || typeof opts !== 'object')
		throw new PluginError(
			`options: expected an object but received ${typeof opts}`,
		);

	const options = mergeOptions(opts as Options);
	validateOptions(options);

	const generationMode = inferGenerationMode(options);

	eleventyConfig.addTransform(
		'eleventy-plugin-icons/delayed',
		async function (
			this: { page: { icons: Map<string, Icon> } },
			content: string,
		) {
			if (this.page.icons !== undefined) {
				for (const icon of this.page.icons.values()) {
					addIconIfMissing(usedIcons, icon);
				}
			}

			relFileUrl ??= await getWrittenSpriteRelativeUrl(options);
			hrefPrefix ??= relFileUrl === undefined ? '' : `/${relFileUrl}`;

			for (const icon of usedIcons.values()) {
				content = content.replaceAll(
					PLACEHOLDER_ICON(icon.id),
					await generateSVG(icon, hrefPrefix),
				);
			}

			if (generationMode === GenerationMode.Inlined) {
				return content;
			}

			if (generationMode === GenerationMode.EmbeddedSprite) {
				content = content.replaceAll(
					PLACEHOLDER_SVG_SPRITE_CONTENT,
					this.page.icons === undefined
						? ''
						: await createSpriteWithExtraIcons(
								Array.from(this.page.icons.values()),
							),
				);
			}

			content = content.replaceAll(PLACEHOLDER_SVG_SPRITE_URL, hrefPrefix);

			return content;
		},
	);

	const generateSVG = async (icon: Icon, hrefPrefix: string) => {
		const content = await icon.content(options);
		if (!content) {
			return '';
		}

		if (generationMode === GenerationMode.Inlined) {
			return processXMLIcon(
				icon.path,
				content,
				icon.attributes,
				options.icon.overwriteExistingAttributes,
			);
		}

		return icon.createSpriteReference(hrefPrefix);
	};

	eleventyConfig.addShortcode(
		options.icon.shortcode,
		function (
			this: { page: { icons?: Map<string, Icon> } },
			input: any,
			attrs: Attributes | string = {},
		) {
			const icon = new Icon(input, options, attrs);

			this.page.icons ??= new Map<string, Icon>();
			addIconIfMissing(this.page.icons, icon);

			// Keep track of used icons for generating sprite.
			addIconIfMissing(usedIcons, icon);

			return PLACEHOLDER_ICON(icon.id);
		},
	);

	eleventyConfig.addShortcode(options.sprite.shortcode, () => {
		if (generationMode !== GenerationMode.EmbeddedSprite) {
			throw new PluginError(
				`The '${options.sprite.shortcode}' shortcode can only be used in 'sprite' mode.`,
			);
		}

		return PLACEHOLDER_SVG_SPRITE_CONTENT;
	});

	eleventyConfig.addShortcode('getSvgSpriteUrl', (): string => {
		if (generationMode === GenerationMode.Inlined) {
			throw new PluginError(
				"The 'getSvgSpriteUrl' shortcode can only be used in 'sprite' mode.",
			);
		}

		if (generationMode === GenerationMode.EmbeddedSprite) {
			throw new PluginError(
				"The 'getSvgSpriteUrl' shortcode can only be used when 'sprite.writeFile' or 'sprite.writeToDirectory' is defined.",
			);
		}

		return PLACEHOLDER_SVG_SPRITE_URL;
	});

	if (
		generationMode !== GenerationMode.Inlined &&
		generationMode !== GenerationMode.EmbeddedSprite
	) {
		eleventyConfig.on(
			'eleventy.after',
			async ({
				directories,
			}: {
				directories: {
					input: string;
					output: string;
				};
			}) => {
				const sprite = await createSpriteWithExtraIcons([
					...usedIcons.values(),
				]);

				if (sprite === '') {
					log.warn('Unexpected undefined sprite value.');
				}

				assert(
					relFileUrl !== undefined,
					'relFileUrl should be defined when the sprite should be persisted.',
				);

				const outputFilepath = path.join(directories.output, relFileUrl);

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

	const createSpriteWithExtraIcons = async (icons: Icon[]) => {
		extraIcons ??= await getExtraIcons(options);

		return await createSprite(icons.concat(extraIcons), options);
	};

	const getWrittenSpriteRelativeUrl = async (
		opts: Options,
	): Promise<string | undefined> => {
		if (generationMode === GenerationMode.NamedFileSprite) {
			return pathToUrl(path.join(opts.sprite.writeFile as string));
		}

		return undefined;
	};

	const pathToUrl = (p: string) => p.split(path.sep).join('/');

	const addIconIfMissing = (map: Map<string, Icon>, icon: Icon) => {
		if (!map.has(icon.id)) {
			map.set(icon.id, icon);
		}
	};
}
