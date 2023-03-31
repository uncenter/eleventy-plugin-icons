const pluginIcons = require('eleventy-plugin-icons');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'sprite',
		enable: ['lucide'],
	});
};
