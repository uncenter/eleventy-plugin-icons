const pluginIcons = require('../.eleventy.js');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'inline',
		sources: [
			{ name: 'custom', path: './icons', default: true },
			{ name: 'lucide', path: 'node_modules/lucide-static/icons' },
		],
		icon: {
			attributesBySource: {
				custom: {
					class: 'custom-icon',
				},
			},
			errorNotFound: false,
		},
		sprite: {
			writeFile: 'path/to/assets/sprite',
			extraIcons: {
				icons: [{ name: 'apple', source: 'lucide' }],
			},
		},
	});
};
