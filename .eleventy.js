const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const memoize = require('just-memoize');

const {
	extractFromString,
	replaceAttributes,
	getIconContent,
	buildSprites,
	getAllIcons,
} = require('./svg');
const { Message, mergeOptions, filterDuplicates, checkFileExists } = require('./utils');

const message = new Message();

module.exports = (eleventyConfig, options) => {
	const defaults = {
		mode: 'inline',
		sources: {},
		default: false,
		optimize: false,
		SVGO: 'svgo.config.js',
		icon: {
			shortcode: 'icon',
			delimiter: ':',
			class: function (name, source) {
				return `icon icon-${name}`;
			},
			id: function (name, source) {
				return `icon-${name}`;
			},
			insertAttributes: {},
			insertAttributesBySource: {},
			combineDuplicateAttributes: ['class'],
			skipIfNotFound: false,
		},
		sprites: {
			shortcode: 'spriteSheet',
			insertAttributes: {
				class: 'sprite-sheet',
				style: 'display: none;',
				'aria-hidden': 'true',
				xmlns: 'http://www.w3.org/2000/svg',
			},
			insertAll: false,
			generateFile: false,
		},
	};

	const settings = mergeOptions(defaults, options);
	if (Array.isArray(settings.sprites.insertAll)) {
		for (let source of settings.sprites.insertAll) {
			if (!settings.sources[source]) {
				message.error(`Source "${source}" not found in sources list.`);
			}
		}
	} else if (settings.sprites.insertAll) {
		settings.sprites.insertAll = Object.keys(settings.sources);
	}
	if (settings.default && !settings.sources[settings.default]) {
		message.error(`Default source "${settings.default}" not found in sources list.`);
	}

	const usedIcons = [];

	const insertIcon = memoize(async function (string, attributes = {}) {
		const { icon, source } = extractFromString(string, settings);
		if (!(await checkFileExists(settings.sources[source]))) {
			message.error(
				`Path: "${settings.sources[source]}" for source: "${source}" does not exist. ${
					settings.sources[source].startsWith('node_modules')
						? 'Did you run "npm install"?'
						: ''
				}`,
			);
		}
		if (this.page.icons === undefined) {
			this.page.icons = [];
		}
		this.page.icons.push([icon, source]);
		usedIcons.push([icon, source]);

		if (settings.mode === 'inline') {
			let content = await getIconContent(source, icon, settings);
			if (content) {
				content = replaceAttributes(
					content,
					[
						{ class: settings.icon.class(icon, source) },
						settings.icon.insertAttributes,
						settings.icon.insertAttributesBySource[source] || {},
						Object.entries(attributes)
							.filter(([key, value]) => key !== '__keywords')
							.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
					],
					settings.icon.combineDuplicateAttributes,
				);
				return content;
			}
			return '';
		} else if (settings.mode === 'sprite') {
			return replaceAttributes(
				`<svg><use href="#${settings.icon.id(icon, source)}"></use></svg>`,
				[
					{ class: settings.icon.class(icon, source) },
					settings.icon.insertAttributes,
					settings.icon.insertAttributesBySource[source] || {},
					Object.entries(attributes)
						.filter(([key, value]) => key !== '__keywords')
						.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
				],
				settings.icon.combineDuplicateAttributes,
			);
		} else {
			message.error(
				`Invalid mode. Expected 'inline' or 'sprite', got '${settings.mode}'.`,
			);
		}
	});

	const insertSprites = async function () {
		let icons = this.page.icons || [];
		if (settings.sprites.insertAll) {
			icons = getAllIcons(settings);
		}
		icons = filterDuplicates(icons);
		return await buildSprites(icons, settings);
	};

	if (settings.sprites.generateFile !== false) {
		eleventyConfig.on('eleventy.after', async ({ dir, runMode, outputMode }) => {
			let icons = usedIcons;
			if (settings.sprites.insertAll) {
				icons = getAllIcons(settings);
			}
			icons = filterDuplicates(icons);
			const sprite = await buildSprites(icons, settings);
			if (sprite !== '') {
				if (settings.sprites.generateFile === true) {
					spritesPath = 'sprite.svg';
				} else {
					if (path.parse(settings.sprites.generateFile).ext !== '.svg') {
						message.error(
							`Invalid sprite file name. Expected '*.svg', got '${settings.sprites.generateFile}'.`,
						);
					}
					spritesPath = settings.sprites.generateFile;
				}
				const file = path.join(dir.output, spritesPath);
				const fileMeta = path.parse(file);
				if (!checkFileExists(fileMeta.dir)) {
					await fs.promises.mkdir(fileMeta.dir, { recursive: true });
				}

				const formatted = prettier.format(sprite, {
					parser: 'html',
				});
				await fs.promises.writeFile(file, formatted);
			}
		});
	}

	eleventyConfig.addShortcode(settings.icon.shortcode, insertIcon);
	eleventyConfig.addShortcode(settings.sprites.shortcode, insertSprites);
	Object.entries(settings.sources).forEach(([source, sourcePath]) => {
		eleventyConfig.addWatchTarget(sourcePath);
	});
};
