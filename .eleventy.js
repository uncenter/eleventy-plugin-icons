const { parseHTML } = require('linkedom');
const { optimize, loadConfig } = require('svgo');

const fs = require('fs/promises');
const path = require('path');
const memoize = require('just-memoize');
const { mergeOptions, reduceAttrs, attrsToString, filterArrayDuplicates, fileExists } = require('./src/utils');
const log = new Logger({ prefix: require('./package.json').name });

const defaultOptions = {
	mode: 'inline', // 'inline' | 'sprite'
	sources: {}, // { [sourceName]: sourcePath, ... }
	default: false, // sourceName | false
	optimize: false, // true | false
	SVGO: 'svgo.config.js', // path to SVGO config file
	icon: {
		shortcode: 'icon', // @string
		delimiter: ':', // @char in specified array
		class: function (name, source) {
			// @function
			return `icon icon-${name}`;
		},
		id: function (name, source) {
			// @function
			return `icon-${name}`;
		},
		insertAttributes: {}, // { [attributeName]: attributeValue, ... }
		insertAttributesBySource: {}, // { [sourceName]: { [attributeName]: attributeValue, ... }, ... }
		overwriteExistingAttributes: true, // true | false (replace existing attributes with attributes from class/id/insertAttributes/insertAttributesBySource)
		ignoreNotFound: false, // true | false
	},
	sprites: {
		shortcode: 'spriteSheet', // @string
		insertAttributes: {
			// { [attributeName]: attributeValue, ... }
			class: 'sprite-sheet',
			'aria-hidden': 'true',
			xmlns: 'http://www.w3.org/2000/svg',
		},
		insertAll: false, // true | false | @array of source names
		generateFile: false, // true | false | @string
	},
};

async function optimizeWithSVGO(content, configPath) {
	try {
		const config = await loadConfig(configPath);
		try {
			const result = optimize(content, config);
			return result.data;
		} catch (error) {
			throw new Error('[${pkg.name}] Error optimizing content with SVGO.');
		}
	} catch (error) {
		throw new Error('[${pkg.name}] Error loading SVGO config file.');
	}
}

function splitIconString(iconString, x) {
	const { delimiter, defaultSource, sources } = x;
	if (!iconString.includes(delimiter)) {
		if (defaultSource) return { icon: iconString, source: defaultSource };
		log.error(`Error parsing icon string: "${iconString}" does not contain a delimiter and no default source is set.`);
	}
	const [source, icon] = iconString.split(delimiter);
	if (!sources[source]) {
		log.error(`Error parsing icon string: "${source}" is not a valid source.`);
	}
	return { icon, source };
}

async function getIconContent({ icon, source, options }) {
	const { sources, optimize, SVGO } = options;
	const sourcePath = sources[source];
	const iconPath = path.join(sourcePath, `${icon}.svg`);
	let content;
	try {
		content = await fs.readFile(iconPath, 'utf-8');
	} catch (error) {
		if (!fileExists(iconPath)) {
			if (!options.icon.ignoreNotFound) {
				log.warn(`Could not read icon file "${iconPath}" from icon "${icon}" in source "${source}".`);
			}
			return '';
		}
		log.error(`Could not read icon file "${iconPath}" from icon "${icon}" in source "${source}".`);
	}
	return optimize ? await optimizeWithSVGO(content, SVGO) : content;
}

async function getAllIcons(options) {
	let icons = [];
	let sources;
	sources = options.sprites.insertAll === true ? Object.keys(options.sources) : options.sprites.insertAll;
	if (!Array.isArray(sources)) {
		log.error(`Error getting all icons: "insertAll" must be an array or true.`);
	}
	for (let source of sources) {
		const files = await fs.readdir(options.sources[source]);
		for (let file of files) {
			if (file.endsWith('.svg')) {
				icons.push([file.replace('.svg', ''), source]);
			}
		}
	}
	return icons;
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

const buildSprites = memoize(async (icons, options) => {
	let symbols = '';
	for (let [icon, source] of icons) {
		let content = await getIconContent({ icon, source, options });
		if (content) {
			const attributes = { id: options.icon.id(icon, source) };
			let symbol = applyAttributes(content, attributes);
			symbol = symbol.replace(/<svg/, '<symbol').replace(/<\/svg>/, '</symbol>');
			symbols += symbol;
		}
	}
	if (symbols !== '') {
		return `<svg ${attrsToString(options.sprites.insertAttributes)}><defs>${symbols}</defs></svg>`;
	}
	return '';
});

module.exports = function (eleventyConfig, configuration = {}) {
	const options = mergeOptions(defaultOptions, configuration);
	const globals = {
		usedIcons: [],
		validatedSources: [],
	};
	if (options.default && !options.sources[options.default]) {
		log.error(`Default source "${options.default}" not found in sources list.`);
	}

	eleventyConfig.addAsyncShortcode(
		options.icon.shortcode,
		memoize(async (iconString, attrs = {}) => {
			const { icon, source } = splitIconString(iconString, {
				delimiter: options.icon.delimiter,
				defaultSource: options.default,
				sources: options.sources,
			});
			if (!globals.validatedSources.includes(source)) {
				if (!options.sources[source]) {
					log.error(`Error getting icon: "${source}" is not a valid source.`);
				}
				globals.validatedSources.push(source);
			}
			const iconContent = await getIconContent({ icon, source, options });
			if (!iconContent) return '';
			globals.usedIcons.push([icon, source]);
			if (attrs !== {} && attrs['__keywords'] !== undefined) {
				delete attrs['__keywords'];
			}
			const attributes = reduceAttrs(
				['class', 'id'],
				attrs,
				{ class: options.icon.class(icon, source) },
				options.icon.insertAttributes || {},
				options.icon.insertAttributesBySource[source] || {},
			);

			if (options.mode === 'inline') {
				const { document } = parseHTML(iconContent);
				const existingAttrs = document.firstChild.attributes || {};
				Object.entries(attributes).forEach(([key, value]) => {
					if (existingAttrs.getNamedItem(key) && !options.icon.overrideexistingAttrs) {
						existingAttrs.getNamedItem(key).value += ` ${value}`;
					} else {
						document.firstChild.setAttribute(key, value);
					}
				});
				return document.firstChild.outerHTML;
			} else if (options.mode === 'sprite') {
				if (this.page) {
					if (this.page.icons === undefined) this.page.icons = [];
					if (!this.page.icons.includes(icon)) this.page.icons.push([icon, source]);
				}
				return `<svg ${attrsToString(attributes)}><use href="#${options.icon.id(icon, source)}"></use></svg>`;
			}
		}),
	);

	async function generateSpriteHTML() {
		let icons = [];
		if (this.page) {
			icons = this.page.icons || [];
		} else {
			icons = globals.usedIcons;
		}
		if (options.sprites.insertAll) icons = await getAllIcons(options);
		if (icons.length === 0 || icons === undefined) return '';
		icons = filterArrayDuplicates(icons);
		return await buildSprites(icons, options);
	}

	eleventyConfig.addShortcode(options.sprites.shortcode, async function () {
		return await generateSpriteHTML();
	});

	if (options.sprites.generateFile !== false) {
		eleventyConfig.on('eleventy.after', async ({ dir, runMode, outputMode }) => {
			const sprite = await generateSpriteHTML();
			if (sprite !== '') {
				if (options.sprites.generateFile === true) {
					spritesPath = 'sprite.svg';
				} else {
					if (path.parse(options.sprites.generateFile).ext !== '.svg') {
						log.error(`Invalid sprite file name. Expected '*.svg', got '${options.sprites.generateFile}'.`);
					}
					spritesPath = options.sprites.generateFile;
				}
				const file = path.join(dir.output, spritesPath);
				const fileMeta = path.parse(file);
				if (!(await fileExists(fileMeta.dir))) await fs.mkdir(fileMeta.dir, { recursive: true });
				await fs.writeFile(file, sprite);
			}
		});
	}

	Object.entries(options.sources).forEach(([source, sourcePath]) => {
		eleventyConfig.addWatchTarget(sourcePath);
	});
};
