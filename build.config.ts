import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['./src/index'],
	declaration: true,
	rollup: {
		emitCJS: true,
		esbuild: {
			minifySyntax: true,
			minifyWhitespace: true,
			minifyIdentifiers: false,
		},
	},
});
