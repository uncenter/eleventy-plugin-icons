const { optimize } = require('svgo');
const { loadConfig } = require('svgo');
const { stringifyAttributes } = require('./utils');

const prettier = require('prettier');
const path = require('path');
const fs = require('fs');

const { Message } = require('./utils');
const message = new Message();

async function optimizeSVGContent(svgContent, configPath) {
	const config = await loadConfig(configPath);
	const result = optimize(svgContent, config);
	return result.data;
}

function extractFromString(str, delimiter, sources, def) {
	if (str.includes(delimiter)) {
		const [source, icon] = str.split(delimiter);
		if (!sources[source]) {
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

async function getSVGContent(source, icon, settings) {
	const sourcePath = settings.sources[source];
	try {
		const content = await fs.promises.readFile(
			path.join(sourcePath, icon + '.svg'),
			'utf8',
		);
		const formattedContent = prettier.format(content, {
			tabWidth: 2,
			printWidth: 1000,
			trailingComma: 'all',
			semi: true,
			parser: 'html',
		});
		if (settings.optimize) {
			return await optimizeSVGContent(formattedContent, settings.SVGO);
		}
		return formattedContent;
	} catch (err) {
		if (settings.icon.skipIfNotFound) {
			message.warn(`Icon "${icon}" not found in source "${source}" ("${sourcePath}").`);
			return;
		}
		message.error(`Icon "${icon}" not found in source "${source}" ("${sourcePath}").`);
	}
}

async function buildSprites(icons, settings) {
	let sprite = `<svg ${stringifyAttributes(settings.sprites.insertAttributes)}>`;

	let symbols = '';
	for (let [icon, source] of icons) {
		let content = await getSVGContent(source, icon, settings);
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
}

module.exports = {
	optimizeSVGContent,
	extractFromString,
	replaceAttributes,
	getSVGContent,
	buildSprites,
};
