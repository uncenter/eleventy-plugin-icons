const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

const {
	optimizeSVGContent,
	extractFromString,
	replaceAttributes,
	getSVGContent,
	buildSprites,
} = require('./svg');
const { Message, mergeOptions, filterDuplicates } = require('./utils');

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
	Object.entries(settings.sources).forEach(([source, sourcePath]) => {
		if (!fs.existsSync(sourcePath)) {
			if (sourcePath.startsWith('node_modules')) {
				message.error(
					`Path: "${sourcePath}" for source: "${source}" does not exist. Did you run "npm install"?`,
				);
			}
			message.error(`Path: "${sourcePath}" for source: "${source}" does not exist.`);
		}
	});
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

	const insertIcon = async function (string, attributes = {}) {
		const { icon, source } = extractFromString(
			string,
			settings.icon.delimiter,
			settings.sources,
			settings.default,
		);
		if (this.page.icons === undefined) {
			this.page.icons = [];
		}
		this.page.icons.push([icon, source]);
		usedIcons.push([icon, source]);

		if (settings.mode === 'inline') {
			let content = getSVGContent(
				source,
				settings.sources[source],
				icon,
				settings.icon.skipIfNotFound,
			);
			if (content) {
				if (settings.optimize) {
					content = await optimizeSVGContent(content, settings.SVGO);
				}
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
			return `<svg class="${settings.icon.class(
				icon,
				source,
			)}"><use href="#${settings.icon.id(icon, source)}"></use></svg>`;
		} else {
			message.error(
				`Invalid mode. Expected 'inline' or 'sprite', got '${settings.mode}'.`,
			);
		}
	};

	const insertSprites = async function () {
		let icons = [];
		if (settings.sprites.insertAll) {
			for (let source of settings.sprites.insertAll) {
				const iconsFromSource = fs
					.readdirSync(settings.sources[source])
					.filter((file) => file.endsWith('.svg'));
				for (let icon of iconsFromSource) {
					icons.push([icon.replace('.svg', ''), source]);
				}
			}
		} else {
			icons = this.page.icons || [];
		}
		icons = filterDuplicates(icons);
		return await buildSprites(icons, settings);
	};

	if (settings.sprites.generateFile !== false) {
		eleventyConfig.on('eleventy.after', async ({ dir, runMode, outputMode }) => {
			let icons = usedIcons;
			if (settings.sprites.insertAll) {
				icons = [];
				if (settings.sprites.insertAll) {
					for (let source of settings.sprites.insertAll) {
						const iconsFromSource = fs
							.readdirSync(settings.sources[source])
							.filter((file) => file.endsWith('.svg'));
						for (let icon of iconsFromSource) {
							icons.push([icon.replace('.svg', ''), source]);
						}
					}
				}
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
				if (!fs.existsSync(fileMeta.dir)) {
					fs.mkdirSync(fileMeta.dir, { recursive: true });
				}
				const formatted = prettier.format(sprite, {
					parser: 'html',
				});
				fs.writeFileSync(file, formatted);
			}
		});
	}

	eleventyConfig.addShortcode(settings.icon.shortcode, insertIcon);
	eleventyConfig.addShortcode(settings.sprites.shortcode, insertSprites);
	Object.entries(settings.sources).forEach(([source, sourcePath]) => {
		eleventyConfig.addWatchTarget(sourcePath);
	});
};
