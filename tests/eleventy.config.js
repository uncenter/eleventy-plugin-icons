const pluginIcons = require('../.eleventy.js');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'inline',
		sources: {
			tabler: 'node_modules/@tabler/icons/icons',
			custom: './icons',
		},
		icon: {
			insertAttributesBySource: {
				tabler: {
					class: 'this-icon-is-from-tabler',
				},
				custom: {
					class: 'custom-icon',
				},
			},
		},
		sprites: {
			generateFile: 'path/to/assets/sprite.svg',
		},
		default: 'tabler',
	});
};
