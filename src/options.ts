import extend from 'just-extend';
import { z, type ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { log } from './utils';

export const OptionsSchema = z.object({
	mode: z.enum(['inline', 'sprite']),
	sources: z.array(
		z.object({
			name: z.string(),
			path: z.string(),
			default: z.optional(z.boolean()),
		}),
	),
	icon: z.object({
		shortcode: z.string(),
		delimiter: z.string(),
		transform: z.function().args(z.string()).returns(z.promise(z.string())),
		class: z.function().args(z.string(), z.string()).returns(z.string()),
		id: z.function().args(z.string(), z.string()).returns(z.string()),
		attributes: z.record(z.string()),
		attributesBySource: z.record((z.string(), z.record(z.string()))),
		overwriteExistingAttributes: z.boolean(),
		errorNotFound: z.boolean(),
	}),
	sprite: z.object({
		shortcode: z.string(),
		attributes: z.record(z.string()),
		extraIcons: z.object({
			all: z.boolean(),
			sources: z.array(z.string()),
			icons: z.array(z.object({ name: z.string(), source: z.string() })),
		}),
		writeFile: z.union([z.literal(false), z.string()]),
	}),
});

export type Options = z.infer<typeof OptionsSchema>;

export const defaultOptions: Options = {
	mode: 'inline',
	sources: [],
	icon: {
		shortcode: 'icon',
		delimiter: ':',
		transform: async (content) => content,
		class: (name) => `icon icon-${name}`,
		id: (name) => `icon-${name}`,
		attributes: {},
		attributesBySource: {},
		overwriteExistingAttributes: true,
		errorNotFound: true,
	},
	sprite: {
		shortcode: 'spriteSheet',
		attributes: {
			class: 'sprite-sheet',
			'aria-hidden': 'true',
			xmlns: 'http://www.w3.org/2000/svg',
		},
		extraIcons: {
			all: false,
			sources: [],
			icons: [],
		},
		writeFile: false,
	},
};

export function mergeOptions(options: Options): Options {
	return extend(true, defaultOptions, options) as Options;
}

export function validateOptions(options: Options) {
	try {
		OptionsSchema.parse(options);
		if (options.sources.filter((source) => source.default === true).length > 1)
			log.error(`options.sources: Only one default source is allowed.`);

		if (
			[...new Set(options.sources.map((source) => source.name))].length !== options.sources.length
		)
			log.error('options.sources: Source names must be unique.');
	} catch (err) {
		for (const error of fromZodError(err as ZodError).details) {
			const path = `options.${error.path.join('.')}`;
			if (error.code === 'invalid_union') {
				const expecteds = error.unionErrors.flatMap((error) =>
					error.issues.map((issue: any) => issue.expected),
				);
				const receiveds = error.unionErrors.flatMap((error) =>
					error.issues.map((issue: any) => issue.received),
				);
				const codes = error.unionErrors.flatMap((error) => error.issues.map((issue) => issue.code));
				log.error(
					`${path}: Expected ${
						expecteds.length === 1 ? expecteds[0] : expecteds.join(' or ')
					}, received ${
						receiveds.length === 1 ? receiveds[0] : receiveds.join(' / ')
					} (${codes.join(', ')}).`,
				);
			} else {
				log.error(`${path}: ${error.message}.`);
			}
		}
	}
}
