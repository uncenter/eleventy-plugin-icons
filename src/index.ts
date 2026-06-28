import type { Options } from './options';
import type { Attributes, DeepPartial, Prettify } from './types';

import fs from 'node:fs/promises';
import path from 'node:path';

import { PluginError } from './error';
import { createSprite, getExtraIcons, Icon } from './icon';
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
	let extraIcons: Icon[] | undefined;

	if (opts === null || typeof opts !== 'object')
		throw new PluginError(
			`options: expected an object but received ${typeof opts}`,
		);

	const options = mergeOptions(opts as Options);
	validateOptions(options);

	const gm = inferGenerationMode(options);

	// Add icon replacement transform; runs after template compilation during which the placeholders are injected, replacing the placeholder comments with actual content.
	eleventyConfig.addTransform(
		'eleventy-plugin-icons/delayed',
		async function (
			this: { page: { icons: Map<string, Icon> } },
			content: string,
		) {
			const svgSpriteUrl =
				gm.mode === GenerationMode.NamedFileSprite
					? `/${pathToUrl(path.join(gm.writeFile))}`
					: '';

			// Replace the placeholders in the file with either inline icons or sprite references.
			for (const icon of usedIcons.values()) {
				content = content.replaceAll(
					PLACEHOLDER_ICON(icon.instanceId),
					await createInlineOrSpriteIcon(icon, svgSpriteUrl),
				);
			}

			// Nothing else needs to be done if the icons have been inlined.
			if (gm.mode === GenerationMode.Inlined) return content;
			// Replace the sprite content placeholders if sprites are embedded.
			if (gm.mode === GenerationMode.EmbeddedSprite) {
				content = content.replaceAll(
					PLACEHOLDER_SVG_SPRITE_CONTENT,
					this.page.icons === undefined
						? ''
						: await createSpriteWithExtraIcons(
								Array.from(this.page.icons.values()),
							),
				);
			}
			// Replace the sprite URL placeholders if the sprite is being written to an external file.
			if (gm.mode === GenerationMode.NamedFileSprite)
				content = content.replaceAll(PLACEHOLDER_SVG_SPRITE_URL, svgSpriteUrl);

			return content;
		},
	);

	const createInlineOrSpriteIcon = async (
		icon: Icon,
		spriteUrlPrefix: string,
	) => {
		const content = await icon.content(options);
		if (!content) return '';

		if (gm.mode === GenerationMode.Inlined) {
			return processXMLIcon(
				icon.path,
				content,
				icon.attributes,
				options.icon.overwriteExistingAttributes,
			);
		}

		return icon.createSpriteReference(spriteUrlPrefix);
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

			return PLACEHOLDER_ICON(icon.instanceId);
		},
	);

	eleventyConfig.addShortcode(options.sprite.shortcode, () => {
		if (gm.mode !== GenerationMode.EmbeddedSprite) {
			throw new PluginError(
				`The '${options.sprite.shortcode}' shortcode can only be used in 'sprite' mode.`,
			);
		}

		return PLACEHOLDER_SVG_SPRITE_CONTENT;
	});

	eleventyConfig.addShortcode('getSvgSpriteUrl', (): string => {
		if (gm.mode !== GenerationMode.NamedFileSprite) {
			throw new PluginError(
				"The 'getSvgSpriteUrl' shortcode can only be used in 'sprite' mode when either 'sprite.writeFile' or 'sprite.writeToDirectory' is defined.",
			);
		}

		return PLACEHOLDER_SVG_SPRITE_URL;
	});

	if (gm.mode === GenerationMode.NamedFileSprite) {
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

				const outputFilepath = path.join(directories.output, gm.writeFile);

				const fileDirectory = path.parse(outputFilepath).dir;

				try {
					await fs.readdir(fileDirectory);
				} catch {
					await fs.mkdir(fileDirectory, { recursive: true });
				}

				try {
					await fs.writeFile(outputFilepath, sprite);
				} catch (err) {
					throw new PluginError(
						`Unable to write sprite file to '${outputFilepath}'.`,
						err,
					);
				}
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

	const pathToUrl = (p: string) => p.split(path.sep).join('/');

	const addIconIfMissing = (map: Map<string, Icon>, icon: Icon) => {
		if (!map.has(icon.instanceId)) {
			map.set(icon.instanceId, icon);
		}
	};
}
