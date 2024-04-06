import pluginIcons from '../../dist/index.mjs';

export default (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'sprite',
		sources: [
			{
				name: 'custom',
				path: './icons',
				default: true,
				getFileName: (icon) => 'icon-' + icon,
			},
			{ name: 'lucide', path: 'node_modules/lucide-static/icons' },
		],
		icon: {
			shortcode: 'sprite',
			errorNotFound: false,
		},
	});

	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'inline',
		sources: [
			{ name: 'custom', path: './icons', default: true },
			{ name: 'lucide', path: 'node_modules/lucide-static/icons' },
		],
		icon: {
			shortcode: 'inline',
			errorNotFound: false,
		},
	});

	return {
		dir: {
			input: 'src/',
		},
	};
};
