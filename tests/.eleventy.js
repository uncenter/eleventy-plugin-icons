const pluginIcons = require('../.eleventy.js');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'sprite',
		sources: {
			tabler: 'node_modules/@tabler/icons/icons',
			custom: './icons',
		},
		sprites: {
			insertAll: ['custom'],
			generateFile: true,
		},
		default: 'tabler',
	});
};
