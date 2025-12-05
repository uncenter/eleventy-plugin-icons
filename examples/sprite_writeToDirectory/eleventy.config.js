import pluginIcons from 'eleventy-plugin-icons';

export default function (eleventyConfig) {
	eleventyConfig.addGlobalData('layout', 'layout.njk');
	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'sprite',
		sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
		sprite: {
			writeToDirectory: 'assets/icons',
		},
	});
}
