const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const { optimize } = require('svgo');
const { loadConfig } = require('svgo');

async function optimizeSVG(svg, path) {
	const config = await loadConfig(path);
	const result = optimize(svg, config);
	return result.data;
}

const Chalk = require('chalk');

module.exports = (eleventyConfig, options) => {
	const validOptions = {
		mode: function (value, options) {
			return ['sprite', 'inline'].includes(value);
		},
		default: function (value, options) {
			return (
				(typeof value === 'string' && options.sources[value] !== undefined) ||
				value === false
			);
		},
		sources: function (value, options) {
			return typeof value === 'object';
		},
		enable: function (value, options) {
			return (
				Array.isArray(value) &&
				value.every((source) => Object.keys(options.sources).includes(source))
			);
		},
		optimize: function (value, options) {
			return typeof value === 'boolean';
		},
		SVGO: function (value, options) {
			return typeof value === 'string';
		},
		insertIcon: {
			shortcode: function (value, options) {
				return typeof value === 'string' && value.length > 0;
			},
			delimiter: function (value, options) {
				return (
					typeof value === 'string' &&
					value.length === 1 &&
					[
						'!',
						'@',
						'#',
						'$',
						'%',
						'^',
						'&',
						'*',
						'+',
						'=',
						'|',
						':',
						';',
						'<',
						'>',
						'.',
						'?',
						'/',
						'~',
					].includes(value)
				);
			},
			class: function (value, options) {
				return typeof value === 'function' || typeof value === 'string';
			},
			id: function (value, options) {
				return typeof value === 'function' || typeof value === 'string';
			},
			override: function (value, options) {
				return typeof value === 'boolean';
			},
		},
		insertSpriteSheet: {
			shortcode: function (value, options) {
				return typeof value === 'string' && value.length > 0;
			},
			class: function (value, options) {
				return typeof value === 'string';
			},
			styles: function (value, options) {
				return typeof value === 'string';
			},
			override: function (value, options) {
				return typeof value === 'boolean';
			},
		},
		removeAttributes: function (value, options) {
			return Array.isArray(value);
		},
	};

	const defaults = {
		// Mode of the plugin. Can be "sprite" or "inline".
		mode: 'inline',
		// Defines custom sources. For example, to add a source called "custom" with a path to your custom icons directory, you would do: sources: { custom: "./path/to/icons" }. These merged with the default sources.
		sources: {
			tabler: 'node_modules/@tabler/icons/icons',
			lucide: 'node_modules/lucide-static/icons',
			feather: 'node_modules/feather-icons/dist/icons',
		},
		// The sources to enable. Can be "tabler", "lucide", "feather" or a custom source.
		enable: [],
		// The default source for icons without a source (e.g. "activity" instead of "tabler:activity"). Can be false or any defined source.
		default: false,
		optimize: false, // Whether to optimize the SVGs.
		SVGO: 'svgo.config.js', // Path to the SVGO config file.
		insertIcon: {
			shortcode: 'icon', // The shortcode to insert the icon.
			delimiter: ':', // The delimiter between the source and the icon name (e.g. the ':' in "tabler:activity"). Must be a single character. Must be in ["!", "@", "#", "$", "%", "^", "&", "*", "+", "=", "|", ":", ";", "<", ">", ".", "?", "/", "~"].
			class: function (name, source) {
				// The class of the inserted icon (e.g. "icon icon-activity") on either the sprite or the inline icon.
				return `icon icon-${name}`;
			},
			id: function (name, source) {
				// The ID/link of sprite icons (e.g. "icon-activity").
				return `icon-${name}`;
			},
			override: false, // Whether to continue even if the icon is not found (don't exit the process).
		},
		insertSpriteSheet: {
			shortcode: 'spriteSheet', // The shortcode to insert the sprite sheet.
			class: 'sprite-sheet', // Class of the inserted sprite sheet.
			styles: 'position: absolute; width: 0; height: 0; overflow: hidden;', // Visually hide the sprite sheet.
			override: false, // Whether to insert the sprite sheet even in inline mode.
		},
		removeAttributes: ['class', 'width', 'height', 'xlmns'], // Attributes to remove from the source SVGs.
	};

	// Merge options with defaults
	const settings = Object.entries(defaults).reduce((acc, [key, value]) => {
		if (options === undefined) {
			acc[key] = value;
		} else if (options[key] !== undefined) {
			if (value.constructor === Object) {
				acc[key] = Object.assign({}, value, options[key]);
			} else {
				acc[key] = options[key];
			}
		} else {
			acc[key] = value;
		}
		return acc;
	}, {});

	const defaultSources = Object.keys(defaults.sources);

	// Filter out un-enabled sources
	if (settings.enable.length > 0) {
		Object.keys(settings.sources).forEach((key) => {
			if (!settings.enable.includes(key)) {
				delete settings.sources[key];
			}
		});
	} else {
		console.error(
			Chalk.red(
				'No sources enabled for eleventy-plugin-icons. Please add at least one source to the enable array.',
			),
		);
		process.exit(1);
	}

	// Check if all sources exist
	for (const [key, value] of Object.entries(settings.sources)) {
		if (!fs.existsSync(value)) {
			if (key in defaults.sources) {
				console.error(
					Chalk.red(
						`Could not find the source directory for eleventy-plugin-icons: ${key}=${value}. Did you forget to install the package?`,
					),
				);
				process.exit(1);
			}
			console.error(
				Chalk.red(
					`Could not find the source directory for eleventy-plugin-icons: ${key}=${value}.`,
				),
			);
			process.exit(1);
		}
	}

	// Check if all options are valid
	Object.entries(settings).forEach(([key, value]) => {
		if (value.constructor === Object && typeof validOptions[key] === 'object') {
			Object.entries(value).forEach(([subKey, subValue]) => {
				if (!validOptions[key][subKey](subValue, settings)) {
					console.error(
						Chalk.red(
							`Invalid option for eleventy-plugin-icons: ${key}.${subKey}=${subValue}`,
						),
					);
					process.exit(1);
				}
			});
		} else if (!validOptions[key](value, settings)) {
			console.error(
				Chalk.red(`Invalid option for eleventy-plugin-icons: ${key}=${value}`),
			);
			process.exit(1);
		}
	});

	function parseIconSource(string, page) {
		const delimiter = settings.insertIcon.delimiter;
		if (typeof settings.default === 'string' && !string.includes(delimiter)) {
			// If the source is set and the string doesn't contain a source.
			return [settings.sources[settings.default], string];
		} else if (settings.default === false && !string.includes(delimiter)) {
			// If the source is not set and the string doesn't contain a source.
			console.error(
				Chalk.red(
					`No source specified for icon: ${string} (page: ${page.inputPath}). Make sure you are using the correct delimiter (current delimiter: "${delimiter}").`,
				),
			);
			process.exit(1);
		} else if (
			// If the string contains a source but the source is not enabled.
			string.includes(delimiter) &&
			settings.sources[string.split(delimiter)[0]] === undefined
		) {
			if (
				settings.sources[string.split(delimiter)[0]] === undefined &&
				defaultSources.includes(string.split(delimiter)[0])
			) {
				console.error(Chalk.red(`Source is not enabled: ${string.split(delimiter)[0]}`));
				process.exit(1);
			} else {
				console.error(
					Chalk.red(
						`Invalid source specified: "${string}" (page: ${page.inputPath}). Did you forget to define or enable the source?`,
					),
				);
				process.exit(1);
			}
		}
		const [source, name] = string.split(delimiter);
		if (settings.sources[source] !== undefined) {
			// If the source is enabled.
			return [settings.sources[source], name];
		}
	}

	function getIconContent(name, source, page) {
		const iconPath = path.join(source, `${name}.svg`);
		if (fs.existsSync(iconPath)) {
			const content = prettier.format(fs.readFileSync(iconPath, 'utf8'), {
				tabWidth: 2,
				printWidth: 1000,
				trailingComma: 'all',
				semi: true,
				parser: 'html',
			});

			let attributes = content.match(/<svg ([^>]+)>/)[1]; // Get the attributes of the <svg> tag.
			attributes = attributes.match(/(\w-?)+="[^"]+"/g);
			attributes = attributes.filter((attribute) => {
				const name = attribute.split('=')[0]; // Split the attribute into name and value.
				return !settings.removeAttributes.includes(name); // Remove the attributes that are in the removeAttributes array.
			});
			return { content, attributes };
		} else {
			if (settings.insertIcon.override) {
				console.warn(
					Chalk.yellow(
						`Could not find icon: "${name}" in source: "${Object.keys(
							settings.sources,
						).find((key) => settings.sources[key] === source)}" ("${source}") (page: ${
							page.inputPath
						}).`,
					),
				);
				return false;
			} else {
				console.error(
					Chalk.red(
						`Could not find icon: "${name}" in source: "${Object.keys(
							settings.sources,
						).find((key) => settings.sources[key] === source)}" ("${source}") (page: ${
							page.inputPath
						}). Check the documentation of the source for a list of available icons.`,
					),
				);
				process.exit(1);
			}
		}
	}

	const insertIcon = async function (string) {
		if (!parseIconSource(string, this.page)) {
			// If the source is invalid.
			return '';
		}
		const [source, icon] = parseIconSource(string, this.page);
		if (this.page.icons === undefined) {
			this.page.icons = [];
		}
		if (!this.page.icons.includes(icon)) {
			this.page.icons.push([icon, source]);
		}

		if (settings.mode === 'inline') {
			const result = getIconContent(icon, source, this.page);
			if (result) {
				content = result.content
					.replace(
						/<svg([^>]+)>/,
						`<svg class="${settings.insertIcon.class(
							icon,
							source,
						)}" ${result.attributes.join(' ')}>`,
					)
					.replace(/<!--(.*?)-->/g, '');
				if (settings.optimize) {
					content = await optimizeSVG(content, settings.SVGO);
				}
				return content;
			}
			return '';
		} else {
			return `<svg class="${settings.insertIcon.class(
				icon,
				source,
			)}"><use href="#${settings.insertIcon.id(icon, source)}"></use></svg>`;
		}
	};

	let warnedSpriteSheet = false;
	const insertSpriteSheet = function () {
		const page = this.page;
		if (
			settings.mode === 'inline' &&
			!settings.insertSpriteSheet.override &&
			!warnedSpriteSheet
		) {
			console.warn(
				Chalk.yellow(
					`\nIt looks like you are using the ${Chalk.magenta(
						`{% ${settings.insertSpriteSheet.shortcode} %}`,
					)} shortcode in 'inline' mode. Set the mode to 'sprite' to use the sprite sheet or set ${Chalk.magenta(
						'insertSpriteSheet.override',
					)} to ${Chalk.blue(
						'true',
					)} to hide this warning and insert the sprite sheet anyway.\n`,
				),
			);
			warnedSpriteSheet = true;
		}
		if (settings.mode === 'inline' && !settings.insertSpriteSheet.override) {
			return '';
		}
		const pageIcons = this.page.icons || [];
		let sprite = `<svg class="${settings.insertSpriteSheet.class}" aria-hidden="true" style="${settings.insertSpriteSheet.styles}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n<defs>\n`;
		let symbols = '';

		for (let [icon, source] of pageIcons) {
			const result = getIconContent(icon, source, page);
			if (!result) {
				continue;
			}
			symbols += result.content
				.replace(
					/<svg([^>]+)>/,
					`<symbol id="${settings.insertIcon.id(icon, source)}" ${result.attributes.join(
						' ',
					)}>`,
				)
				.replace('</svg>', '</symbol>')
				.replace(/<!--(.*?)-->/g, '');
		}
		if (symbols !== '') {
			sprite += symbols + '</defs>\n</svg>\n';
			return sprite;
		}
		return '';
	};

	eleventyConfig.addShortcode(settings.insertIcon.shortcode, insertIcon);
	eleventyConfig.addShortcode(settings.insertSpriteSheet.shortcode, insertSpriteSheet);
};
