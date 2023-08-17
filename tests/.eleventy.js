const pluginIcons = require('../.eleventy.js');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'inline',
		sources: [
			{ name: 'tabler', path: 'node_modules/@tabler/icons/icons', default: true },
			{ name: 'custom', path: './icons' },
		],
		icon: {
			attributesBySource: {
				tabler: {
					class: 'this-icon-is-from-tabler',
				},
				custom: {
					class: 'custom-icon',
				},
			},
			errorNotFound: false,
		},
		sprite: {
			writeFile: 'path/to/assets/sprite',
			extraIcons: {
				icons: [{ name: '2fa', source: 'tabler' }],
			},
		},
	});
};
