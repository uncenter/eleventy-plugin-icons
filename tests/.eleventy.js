const pluginIcons = require('../.eleventy.js');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'sprite',
		sources: {
			tabler: 'node_modules/@tabler/icons/icons',
			custom: './icons',
		},
		icon: {
			insertAttributesBySource: {
				tabler: {
					class: 'testing-123',
				},
				custom: {
					class: 'testing-456',
				},
			},
		},
		sprites: {
			generateFile: true,
		},
		default: 'tabler',
	});
};
