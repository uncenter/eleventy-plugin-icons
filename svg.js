const { optimize, loadConfig } = require('svgo');
const { Message, attrsToString } = require('./utils');
const message = new Message();

const prettier = require('prettier');
const path = require('path');
const fs = require('fs/promises');
const memoize = require('just-memoize');

async function optimizeIcon(svgContent, configPath) {
	try {
		const config = await loadConfig(configPath);
		const result = optimize(svgContent, config);
		return result.data;
	} catch (error) {
		message.error(`Error loading SVGO config: could not find "${configPath}".`);
	}
}

function extractFromString(str, settings) {
	const delimiter = settings.icon.delimiter;
	const def = settings.default;
	if (str.includes(delimiter)) {
		const [source, icon] = str.split(delimiter);
		if (!settings.sources[source]) {
			message.error(`Source "${source}" not found in sources list.`);
		}
		return { icon: icon, source };
	}
	if (def) {
		return { icon: str, source: def };
	}
	message.error(
		`No default source set and no source specified in "${str}". Are you missing a delimiter (${delimiter})?`,
	);
}

function replaceAttributes(svg, attributes, combineDuplicateAttributes) {
	if (combineDuplicateAttributes === true) {
		attributes = attributes.reduce((obj, item) => {
			Object.entries(item).forEach(([key, value]) => {
				if (obj[key]) {
					obj[key] = obj[key] + ' ' + value;
				} else {
					obj[key] = value;
				}
			});
			return obj;
		}, {});
	} else {
		attributes = attributes.reduce((obj, item) => {
			Object.entries(item).forEach(([key, value]) => {
				if (
					Array.isArray(combineDuplicateAttributes) &&
					combineDuplicateAttributes.includes(key)
				) {
					if (obj[key]) {
						obj[key] = obj[key] + ' ' + value;
					} else {
						obj[key] = value;
					}
				} else {
					obj[key] = value;
				}
			});
			return obj;
		}, {});
	}
	const content = svg;
	svg = svg.match(/<svg[^>]*>/)[0];
	Object.entries(attributes).forEach(([key, value]) => {
		let regex = new RegExp(`(${key})="([^"]*)"`, 'g');
		if (svg.match(regex)) {
			svg = svg.replace(regex, `${key}="${value}"`);
		} else {
			svg = svg.replace('<svg', `<svg ${key}="${value}"`);
		}
	});
	return content.replace(/<svg[^>]*>/, svg);
}

const getIconContent = memoize(async function (source, icon, settings) {
	const sourcePath = settings.sources[source];
	try {
		const content = await fs.readFile(path.join(sourcePath, icon + '.svg'), 'utf8');
		const formattedContent = prettier.format(content, {
			tabWidth: 2,
			printWidth: 1000,
			trailingComma: 'all',
			semi: true,
			parser: 'html',
		});
		if (settings.optimize) {
			try {
				return await optimizeIcon(formattedContent, settings.SVGO);
			} catch (err) {
				message.error(
					`Error optimizing icon "${icon}" in source "${source}" ("${sourcePath}").`,
				);
			}
		}
		return formattedContent;
	} catch (err) {
		if (settings.icon.notFound === 'error') {
			message.error(`Icon "${icon}" not found in source "${source}" ("${sourcePath}").`);
		} else if (settings.icon.notFound === 'warn') {
			message.warn(`Icon "${icon}" not found in source "${source}" ("${sourcePath}").`);
		}
	}
});

const buildSprites = memoize(async function (icons, settings) {
	let sprite = `<svg ${attrsToString(settings.sprites.insertAttributes)}>`;

	let symbols = '';
	for (let [icon, source] of icons) {
		let content = await getIconContent(source, icon, settings);
		if (content) {
			content = replaceAttributes(
				content,
				[{ id: settings.icon.id(icon, source) }],
				settings.icon.combineDuplicateAttributes,
			);

			symbols += content.replace('<svg', `<symbol`).replace('</svg>', '</symbol>');
		}
	}
	if (symbols !== '') return sprite + '<defs>' + symbols + '</defs></svg>';
	return '';
});

const getAllIcons = memoize(async function (settings) {
	let icons = [];
	if (settings.sprites.insertAll === true) {
		settings.sprites.insertAll = Object.keys(settings.sources);
	}
	if (!Array.isArray(settings.sprites.insertAll)) {
		message.error(`"insertAll" must be an array or boolean.`);
	}
	for (let source of settings.sprites.insertAll) {
		const files = await fs.readdir(settings.sources[source]);
		for (let file of files) {
			if (file.endsWith('.svg')) {
				icons.push([file.replace('.svg', ''), source]);
			}
		}
	}
	return icons;
});

module.exports = {
	optimizeIcon,
	extractFromString,
	replaceAttributes,
	getIconContent,
	buildSprites,
	getAllIcons,
};
