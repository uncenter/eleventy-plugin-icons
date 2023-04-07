const { optimize } = require('svgo');
const { loadConfig } = require('svgo');

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

function replaceAttributes(svg, attributes) {
	Object.entries(attributes).forEach(([key, value]) => {
		let regex = new RegExp(`(${key})="([^"]*)"`, 'g');
		if (svg.match(regex)) {
			svg = svg.replace(regex, `${key}="${value}"`);
		} else {
			svg = svg.replace('<svg ', `<svg ${key}="${value}" `);
		}
	});
	return svg;
}

function getSVGContent(source, sourcePath, name, skipIfNotFound) {
	const iconPath = path.join(sourcePath, name + '.svg');
	if (fs.existsSync(iconPath)) {
		const content = prettier.format(fs.readFileSync(iconPath, 'utf8'), {
			tabWidth: 2,
			printWidth: 1000,
			trailingComma: 'all',
			semi: true,
			parser: 'html',
		});
		return content;
	}
	if (skipIfNotFound) {
		return;
	}
	message.error(`Icon "${name}" not found in source "${source}" ("${sourcePath}").`);
}

module.exports = {
	optimizeSVGContent,
	extractFromString,
	replaceAttributes,
	getSVGContent,
};
