const { parseHTML } = require('linkedom');

const fs = require('node:fs/promises');
const path = require('node:path');
const memoize = require('just-memoize');
const merge = require('./src/merge');

const { reduceAttrs, attrsToString, filterArrayDuplicates } = require('./src/utils');
const { Logger } = require('./src/log');
const log = new Logger(require('./package.json').name);

const defaultOptions = {
	mode: 'inline', // 'inline' | 'sprite'
	sources: [], // [ { name: '', path: '', default?: true | false }, ... ]
	icon: {
		shortcode: 'icon', // string
		delimiter: ':', // string
		transform: async function (content) {
			return content;
		},
		class: function (name, source) {
			return `icon icon-${name}`;
		},
		id: function (name, source) {
			return `icon-${name}`;
		},
		attributes: {}, // { 'attribute': 'value', ... }
		attributesBySource: {}, // { 'source': { 'attribute': 'value', ... }, ... }
		overwriteExistingAttributes: true, // true | false
		errorNotFound: true, // true | false
	},
	sprite: {
		shortcode: 'spriteSheet', // string
		attributes: {
			// { 'attribute': 'value', ... }
			class: 'sprite-sheet',
			'aria-hidden': 'true',
			xmlns: 'http://www.w3.org/2000/svg',
		},
		extraIcons: {
			all: false, // true | false
			sources: [], // ['', '', '']
			icons: [], // [ { name: '', source: '' }]
		},
		writeFile: false, // false | 'path/to/file'
	},
};

class Icon {
	constructor(input, options) {
		this.options = options;
		if (typeof input === 'object') {
			this.name = input.name;
			this.source = input.source;
		} else if (typeof input === 'string') {
			if (!input.includes(options.icon.delimiter)) {
				const defaultSource = options.sources.find((source) => source.default === true);
				if (defaultSource) {
					this.name = input;
					this.source = defaultSource.name;
				} else {
					log.error(`'${input}' does not contain a delimiter and no default source is set`);
				}
			} else {
				const [source, icon] = input.split(options.icon.delimiter);
				if (options.sources.find((x) => x.name === this.source)) {
					log.error(`'${source}' is not a registered source`);
				}
				this.name = icon;
				this.source = source;
			}
		}
		this.path = path.join(
			options.sources.find((source) => source.name === this.source).path,
			`${this.name}.svg`,
		);
	}

	name = this.name;
	source = this.source;

	content = memoize(async () => {
		const options = this.options;
		try {
			let content = await fs.readFile(this.path, 'utf-8');
			if (!content) {
				log.warn(
					`icon '${this.name}' in source '${this.source}' (${this.path}) appears to be empty`,
				);
				content = '';
			}
			return options.icon.transform ? await options.icon.transform(content) : content;
		} catch {
			log[options.icon.errorNotFound ? 'error' : 'warn'](
				`icon '${this.name}' in source '${this.source}' not found`,
			);
		}
	});
}

class Plugin {
	constructor(options) {
		this.options = merge(defaultOptions, options);
	}

	createIcon = memoize((icon) => new Icon(icon, this.options));

	createSprite = memoize(async (icons) => {
		let symbols = '';
		for (const icon of icons) {
			let content = await icon.content();
			if (content) {
				const attributes = { id: this.options.icon.id(icon.name, icon.source) };
				let symbol = applyAttributes(content, attributes);
				symbol = symbol.replace(/<svg/, '<symbol').replace(/<\/svg>/, '</symbol>');
				symbols += symbol;
			}
		}
		if (symbols !== '') {
			return `<svg ${attrsToString(this.options.sprite.attributes)}><defs>${symbols}</defs></svg>`;
		}
		return '';
	});

	extraIcons = async function () {
		let icons = [];
		let sourceNames = [];

		const extraIcons = this.options.sprite.extraIcons;

		if (extraIcons.all === true) {
			sourceNames.push(...this.options.sources.map((source) => source.name));
		} else {
			if (Array.isArray(extraIcons.sources)) {
				extraIcons.sources.forEach((name) => {
					const source = this.options.sources.find((source) => source.name === name);
					if (!source) {
						log.error(`options.extraIcons.sources: source name '${name}' is not registered`);
					}
					sourceNames.push(source);
				});
			} else if (Array.isArray(extraIcons.icons)) {
				for (const icon of extraIcons.icons) {
					icons.push(this.createIcon(icon));
				}
			}
		}

		const sources = sourceNames.map((name) =>
			this.options.sources.find((source) => source.name === name),
		);
		for (const source of sources) {
			const files = await fs.readdir(source.path);
			for (const file of files) {
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

function applyAttributes(htmlstring, attributes) {
	const { document } = parseHTML(htmlstring);
	if (!document) return htmlstring;
	const element = document.firstChild;
	if (!element) return htmlstring;
	Object.entries(attributes).forEach(([key, value]) => {
		element.setAttribute(key, value);
	});
	return element.outerHTML;
}

module.exports = function (eleventyConfig, options = {}) {
	this.usedIcons = [];
	this.plugin = new Plugin(options);
	options = this.plugin.options;

	const defaultSources = options.sources.filter((source) => source.default === true);
	if (defaultSources.length > 1) {
		log.error(`options.sources: too many default sources (max: 1)`);
	}

	const uniqueSourceNames = options.sources.map((source) => source.name);
	if (new Set(uniqueSourceNames).length < uniqueSourceNames.length) {
		log.error('options.sources: source names must be unique');
	}

	eleventyConfig.addAsyncShortcode(
		options.icon.shortcode,
		memoize(async (input, attrs = {}) => {
			const icon = this.plugin.createIcon(input);
			this.usedIcons.push(icon);

			const content = await icon.content();
			if (!content) return '';

			switch (typeof attrs) {
				case 'string': {
					attrs = JSON.parse(attrs);
				}
				case 'object': {
					if (attrs['__keywords'] !== undefined) {
						delete attrs['__keywords'];
					}
				}
			}
			const attributes = reduceAttrs({
				keysToCombine: ['class', 'id'],
				objects: [
					attrs,
					{ class: options.icon.class(icon.name, icon.source) },
					options.icon.attributes || {},
					options.icon.attributesBySource[icon.source] || {},
				],
			});

			if (options.mode === 'inline') {
				const { document } = parseHTML(content);
				const existingAttrs = document.firstChild?.attributes || {};
				Object.entries(attributes).forEach(([key, value]) => {
					if (existingAttrs.getNamedItem(key) && !options.icon.overwriteExistingAttributes) {
						existingAttrs.getNamedItem(key).value += ` ${value}`;
					} else {
						document.firstChild.setAttribute(key, value);
					}
				});
				return document.firstChild.outerHTML;
			} else if (options.mode === 'sprite') {
				if (this.page) {
					if (this.page.icons === undefined) this.page.icons = [];
					if (!this.page.icons.includes(icon)) this.page.icons.push(icon);
				}
				return `<svg ${attrsToString(attributes)}><use href="#${options.icon.id(
					icon.name,
					icon.source,
				)}"></use></svg>`;
			}
		}),
	);

	async function generateSpriteHTML() {
		let icons = [];
		if (this.page) {
			icons = this.page.icons || [];
		} else {
			icons = this.usedIcons;
		}
		icons.push(...(await this.plugin.extraIcons()));
		if (icons.length === 0 || icons === undefined) return '';
		icons = filterArrayDuplicates(icons);
		return await this.plugin.createSprite(icons);
	}

	eleventyConfig.addShortcode(options.sprite.shortcode, async function () {
		return await generateSpriteHTML();
	});

	if (typeof options.sprite.writeFile === 'string') {
		eleventyConfig.on('eleventy.after', async ({ dir }) => {
			const sprite = await generateSpriteHTML();
			if (sprite !== '') {
				const file = path.join(dir.output, options.sprite.writeFile);
				const fileDir = path.parse(file).dir;
				try {
					await fs.readdir(fileDir);
				} catch {
					await fs.mkdir(fileDir, { recursive: true });
				}
				await fs.writeFile(file, sprite);
			}
		});
	}

	options.sources.forEach((source) => {
		eleventyConfig.addWatchTarget(source.path);
	});
};
