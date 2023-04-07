const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

const {
	optimizeSVGContent,
	extractFromString,
	replaceAttributes,
	getSVGContent,
} = require('./svg');
const { Message, mergeOptions, stringifyAttributes } = require('./utils');

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
			insertAttributes: {
				xmlns: 'http://www.w3.org/2000/svg',
			},
			skipIfNotFound: false,
		},
		sprites: {
			shortcode: 'spriteSheet',
			insertAttributes: {
				class: 'sprite-sheet',
				style: 'display: none;',
				'aria-hidden': 'true',
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

	const insertIcon = async function (string) {
		const { icon, source } = extractFromString(
			string,
			settings.icon.delimiter,
			settings.sources,
			settings.default,
		);
		if (this.page.icons === undefined) {
			this.page.icons = [];
		}
		if (!this.page.icons.includes(icon)) {
			this.page.icons.push([icon, source]);
		}

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
				content = replaceAttributes(content, {
					...settings.icon.insertAttributes,
					class: settings.icon.class(icon, source),
				});
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
		let sprite = `<svg ${stringifyAttributes(settings.sprites.insertAttributes)}>`;

		let symbols = '';
		let icons;
		if (settings.sprites.insertAll) {
			icons = [];
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
		for (let [icon, source] of icons) {
			let content = getSVGContent(
				source,
				settings.sources[source],
				icon,
				settings.icon.skipIfNotFound,
			);
			if (!content) {
				continue;
			}
			if (settings.optimize) {
				content = await optimizeSVGContent(content, settings.SVGO);
			}
			content = replaceAttributes(content, {
				...settings.icon.insertAttributes,
				id: settings.icon.id(icon, source),
			});
			symbols += content.replace('<svg', `<symbol`).replace('</svg>', '</symbol>');
		}
		if (symbols !== '') {
			return sprite + '<defs>' + symbols + '</defs></svg>';
		}
		return '';
	};

	if (settings.sprites.generateFile !== false) {
		eleventyConfig.on('eleventy.after', async ({ dir, runMode, outputMode }) => {
			const sprite = await insertSprites();
			if (sprite !== '') {
				if (settings.sprites.generateFile === true) {
					spritesPath = 'sprite.svg';
				} else {
					if (!settings.sprites.generateFile.endsWith('.svg')) {
						message.error(
							`Invalid sprite file name. Expected '*.svg', got '${settings.sprites.generateFile}'.`,
						);
					}
					spritesPath = settings.sprites.generateFile;
				}
				const file = path.join(dir.output, spritesPath);
				const formatted = prettier.format(sprite, {
					parser: 'html',
				});
				fs.writeFileSync(file, formatted);
			}
		});
	}

	eleventyConfig.addShortcode(settings.icon.shortcode, insertIcon);
	eleventyConfig.addShortcode(settings.sprites.shortcode, insertSprites);
};
