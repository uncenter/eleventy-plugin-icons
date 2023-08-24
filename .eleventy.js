const fs = require('node:fs/promises');
const path = require('node:path');
const memoize = require('just-memoize');
const extend = require('just-extend');

const { combineAttributes, attributesToString, parseSVG } = require('./src/utils');
const { Logger } = require('./src/log');

const log = new Logger(require('./package.json').name);

/**
 * Represents an icon.
 */
class Icon {
	/**
	 * Create a new Icon instance.
	 *
	 * @param {Object|string} input - The icon information, either as an object or a string.
	 * @param {Object} options - Plugin options.
	 */
	constructor(input, options) {
		/**
		 * The name of the icon.
		 * @type {string}
		 */
		this.name;

		/**
		 * The source of the icon.
		 * @type {string}
		 */
		this.source;

		/**
		 * The file path to the SVG icon.
		 * @type {string}
		 */
		this.path;

		if (typeof input === 'object') {
			this.name = input.name;
			this.source = input.source;
		} else if (typeof input === 'string') {
			if (!input.includes(options.icon.delimiter)) {
				this.name = input;
				this.source =
					options.sources.find((source) => source.default === true)?.name ||
					log.error(`Icon '${input}' lacks a delimiter and no default source is set.`);
			} else {
				const [source, icon] = input.split(options.icon.delimiter);
				this.name = icon;
				this.source = source;
			}
		} else {
			log.error(`Invalid input type for Icon constructor: '${typeof input}'.`);
		}

		const sourceObject = options.sources.find((source) => source.name === this.source);
		if (sourceObject) {
			this.path = path.join(sourceObject.path, `${this.name}.svg`);
		} else {
			log.error(`Source '${this.source}' is not defined in options.sources.`);
		}
	}

	/**
	 * Retrieves the content of the SVG icon.
	 *
	 * @async
	 * @param {Object} options - Plugin options.
	 * @returns {Promise<string>} The SVG content of the icon.
	 */
	content = memoize(async (options) => {
		try {
			let content = await fs.readFile(this.path, 'utf-8');
			if (!content) {
				log.warn(`Icon ${JSON.stringify(this)} appears to be empty.`);
				content = '';
			}
			return options.icon.transform ? await options.icon.transform(content) : content;
		} catch {
			log[options.icon.errorNotFound ? 'error' : 'warn'](`Icon ${JSON.stringify(this)} not found.`);
		}
	});
}

/**
 * Represents a plugin that handles icon generation and sprite sheet creation.
 */
class Plugin {
	/**
	 * Creates an instance of the Plugin class.
	 * @param {object} options - Plugin configuration options.
	 * @param {'inline'|'sprite'} options.mode - The mode of the plugin ('inline' or 'sprite').
	 * @param {Array<object>} options.sources - List of icon sources.
	 * @param {object} options.icon - Configuration options for individual icons.
	 * @param {string} options.icon.shortcode - Shortcode for icons.
	 * @param {string} options.icon.delimiter - Delimiter used for icons.
	 * @param {Function} options.icon.transform - Async function to transform icon content.
	 * @param {Function} options.icon.class - Function to generate icon class names.
	 * @param {Function} options.icon.id - Function to generate icon IDs.
	 * @param {object} options.icon.attributes - Default attributes for icons.
	 * @param {object} options.icon.attributesBySource - Icon attributes by source.
	 * @param {boolean} options.icon.overwriteExistingAttributes - Whether to overwrite existing attributes.
	 * @param {boolean} options.icon.errorNotFound - Whether to show an error when an icon is not found.
	 * @param {object} options.sprite - Configuration options for sprite sheet generation.
	 * @param {string} options.sprite.shortcode - Shortcode for sprite sheets.
	 * @param {object} options.sprite.attributes - Default attributes for sprite sheets.
	 * @param {object} options.sprite.extraIcons - Extra icons configuration.
	 * @param {boolean} options.sprite.extraIcons.all - Whether to include all sources for extra icons.
	 * @param {Array<string>} options.sprite.extraIcons.sources - List of source names for extra icons.
	 * @param {Array<object>} options.sprite.extraIcons.icons - List of additional icons.
	 * @param {false|string} options.sprite.writeFile - Whether to write sprite sheet to a file.
	 */
	constructor(options) {
		const defaultOptions = {
			mode: 'inline',
			sources: [],
			icon: {
				shortcode: 'icon',
				delimiter: ':',
				transform: async function (content) {
					return content;
				},
				class: function (name, source) {
					return `icon icon-${name}`;
				},
				id: function (name, source) {
					return `icon-${name}`;
				},
				attributes: {},
				attributesBySource: {},
				overwriteExistingAttributes: true,
				errorNotFound: true,
			},
			sprite: {
				shortcode: 'spriteSheet',
				attributes: {
					class: 'sprite-sheet',
					'aria-hidden': 'true',
					xmlns: 'http://www.w3.org/2000/svg',
				},
				extraIcons: {
					all: false,
					sources: [],
					icons: [],
				},
				writeFile: false,
			},
		};
		this.options = extend(true, defaultOptions, options);
		this.usedIcons = [];
	}

	/**
	 * Creates an Icon instance with memoization.
	 * @param {object} icon - Icon configuration.
	 * @returns {Icon} An instance of the Icon class.
	 */
	createIcon = memoize((icon) => new Icon(icon, this.options));

	/**
	 * Generates a sprite sheet with symbol definitions.
	 * @param {Array<Icon>} icons - List of icons to include in the sprite sheet.
	 * @returns {Promise<string>} A string representing the generated sprite sheet.
	 */
	generateSprite = memoize(async (icons) => {
		// Create an array of promises that generate symbol definitions for each icon.
		const symbols = await Promise.all(
			[...new Set(icons || [])].map(async (icon) => {
				const content = await icon.content(this.options);
				// If content exists, convert it to a symbol element and add attributes.
				if (content) {
					return parseSVG(content, { id: this.options.icon.id(icon.name, icon.source) }, true)
						.replace(/<svg/, '<symbol')
						.replace(/<\/svg>/, '</symbol>');
				}
				return '';
			}),
		);

		// Combine the generated symbol strings and filter out empty ones.
		const symbolsString = symbols.filter(Boolean).join('');
		return symbolsString
			? `<svg ${attributesToString(
					this.options.sprite.attributes,
			  )}><defs>${symbolsString}</defs></svg>`
			: ''; // Return an empty string if no symbols were generated.
	});

	/**
	 * Retrieves extra icons based on configuration.
	 * @returns {Promise<Array<Icon>>} List of extra icons.
	 */
	extraIcons = async function () {
		let icons = [];
		let sources = [];

		const extraIcons = this.options.sprite.extraIcons;

		if (extraIcons.all === true) {
			sources.push(...this.options.sources);
		} else {
			if (Array.isArray(extraIcons.sources)) {
				extraIcons.sources.forEach((name) => {
					const source = this.options.sources.find((source) => source.name === name);
					if (!source) {
						log.error(
							`options.sprite.extraIcons.sources: Source '${name}' is not defined in options.sources.`,
						);
					}
					sources.push(source);
				});
			} else if (Array.isArray(extraIcons.icons)) {
				for (const icon of extraIcons.icons) {
					if (!icon.name || !icon.source)
						log.error(`options.sprite.extraIcons.icons: Invalid icon: ${JSON.stringify(icon)}.`);
					icons.push(this.createIcon(icon));
				}
			}
		}

		for (const source of sources) {
			for (const file of await fs.readdir(source.path)) {
				if (file.endsWith('.svg')) {
					icons.push(
						this.createIcon({
							name: file.replace('.svg', ''),
							source: source.name,
						}),
					);
				}
			}
		}
		return icons;
	};
}

module.exports = function (eleventyConfig, options = {}) {
	Object.assign(this, new Plugin(options));
	options = this.options;

	if (options.sources.filter((source) => source.default === true).length > 1)
		log.error(`options.sources: Only one default source is allowed.`);

	if ([...new Set(options.sources.map((source) => source.name))].length !== options.sources.length)
		log.error('options.sources: Source names must be unique.');

	eleventyConfig.addAsyncShortcode(
		options.icon.shortcode,
		memoize(async (input, attrs = {}) => {
			const icon = this.createIcon(input);
			// Keep track of used icons for generating sprite.
			this.usedIcons.push(icon);

			const content = await icon.content(options);
			if (!content) return '';

			switch (typeof attrs) {
				case 'string': {
					attrs = JSON.parse(attrs || {});
				}
				case 'object': {
					// Nunjucks inserts an __keywords key when kwargs are used (https://github.com/mozilla/nunjucks/blob/ea0d6d5396d39d9eed1b864febb36fbeca908f23/nunjucks/src/runtime.js#L123).
					if (attrs['__keywords']) {
						delete attrs['__keywords'];
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
		return await generateSprite(this?.page?.icons);
	});

	if (typeof options.sprite.writeFile === 'string') {
		eleventyConfig.on('eleventy.after', async ({ dir }) => {
			const sprite = await generateSprite([...this.usedIcons, ...(await this.extraIcons())]);
			const file = path.join(dir.output, options.sprite.writeFile);
			const fileDir = path.parse(file).dir;
			try {
				await fs.readdir(fileDir);
			} catch {
				await fs.mkdir(fileDir, { recursive: true });
			}
			await fs.writeFile(file, sprite);
		});
	}

	options.sources.forEach((source) => {
		eleventyConfig.addWatchTarget(source.path);
	});
};
