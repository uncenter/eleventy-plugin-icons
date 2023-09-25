import extend from 'just-extend';
import get from 'just-safe-get';
import typeOf from 'just-typeof';

import { PluginError } from './utils';

export type Options = {
	mode: 'inline' | 'sprite';
	sources: {
		name: string;
		path: string;
		default?: boolean;
	}[];
	icon: {
		shortcode: string;
		delimiter: string;
		transform: (content: string) => Promise<string>;
		class: (name: string, source: string) => string;
		id: (name: string, source: string) => string;
		attributes: {
			[x: string]: string;
		};
		attributesBySource: {
			[x: string]: {
				[x: string]: string;
			};
		};
		overwriteExistingAttributes: boolean;
		errorNotFound: boolean;
	};
	sprite: {
		shortcode: string;
		attributes: {
			[x: string]: string;
		};
		extraIcons: {
			all: boolean;
			sources: string[];
			icons: {
				name: string;
				source: string;
			}[];
		};
		writeFile: false | string;
	};
};

export const defaultOptions: Options = {
	mode: 'inline',
	sources: [],
	icon: {
		shortcode: 'icon',
		delimiter: ':',
		transform: async (content: string) => content,
		class: (name: string) => `icon icon-${name}`,
		id: (name: string) => `icon-${name}`,
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

/**
 *
 * @param options Options to merge with the default options.
 * @returns Merged options object.
 */
export function mergeOptions(options: Partial<Options>): Options {
	return extend(true, defaultOptions, options) as Options;
}

class OptionsError extends PluginError {
	constructor(option: string, expected: string[], value: unknown) {
		super(
			`options.${option}: expected ${expected.join(
				' or ',
			)} but received ${typeOf(value)}`,
		);
	}
}

class CustomOptionsError extends PluginError {
	constructor(option: string, message: string) {
		super(`options.${option}: ${message}`);
	}
}

export function validateOptions(options: Options): options is Options {
	function validateOption(
		option: string,
		expected: ReturnType<typeof typeOf>[],
	) {
		const value = get(options, option);
		if (!expected.includes(typeOf(value))) {
			throw new OptionsError(option, expected, value);
		}
	}

	if (options.mode !== 'inline' && options.mode !== 'sprite') {
		throw new OptionsError('mode', ["'inline'", "'sprite'"], options.mode);
	}

	validateOption('sources', ['array']);
	for (let i = 0; i < options.sources.length; i++) {
		const source = options.sources[i];
		if (typeof source.name !== 'string')
			throw new OptionsError(`sources[${i}].name`, ['string'], source.name);
		if (typeof source.path !== 'string')
			throw new OptionsError(`sources[${i}].path`, ['string'], source.path);
		if (
			typeof source.default !== 'boolean' &&
			typeof source.default !== 'undefined'
		)
			throw new OptionsError(
				`sources[${i}].default`,
				['boolean', 'undefined'],
				source.default,
			);
	}
	if (options.sources.filter((source) => source.default === true).length > 1)
		throw new CustomOptionsError(
			'sources',
			'only one default source is allowed',
		);

	if (
		[...new Set(options.sources.map((source) => source.name))].length !==
		options.sources.length
	)
		throw new CustomOptionsError('sources', 'source names must be unique');

	validateOption('icon', ['object']);
	validateOption('icon.shortcode', ['string']);
	validateOption('icon.delimiter', ['string']);
	validateOption('icon.transform', ['function']);
	validateOption('icon.class', ['function']);
	validateOption('icon.id', ['function']);

	validateOption('icon.attributes', ['object']);
	for (let i = 0; i < Object.entries(options.icon.attributes).length; i++) {
		const [key, value] = Object.entries(options.icon.attributes)[i];
		if (typeof value !== 'string')
			throw new OptionsError(`icon.attributes['${key}']`, ['string'], value);
	}

	validateOption('icon.attributesBySource', ['object']);
	for (
		let i = 0;
		i < Object.entries(options.icon.attributesBySource).length;
		i++
	) {
		const [key, value] = Object.entries(options.icon.attributesBySource)[i];
		if (typeof value !== 'object')
			throw new OptionsError(
				`icon.attributesBySource['${key}']`,
				['object'],
				value,
			);
		for (let j = 0; j < Object.entries(value).length; j++) {
			const [k, v] = Object.entries(value)[i];
			if (typeof v !== 'string')
				throw new OptionsError(
					`icon.attributesBySource['${key}']['${k}']`,
					['string'],
					v,
				);
		}
	}

	validateOption('icon.overwriteExistingAttributes', ['boolean']);
	validateOption('icon.errorNotFound', ['boolean']);
	validateOption('sprite', ['object']);
	validateOption('sprite.shortcode', ['string']);
	validateOption('sprite.attributes', ['object']);
	validateOption('sprite.extraIcons', ['object']);
	validateOption('sprite.extraIcons.all', ['boolean']);

	validateOption('sprite.extraIcons.sources', ['array']);
	for (let i = 0; i < options.sprite.extraIcons.sources.length; i++) {
		const source = options.sprite.extraIcons.sources[i];
		if (typeof source !== 'string')
			throw new OptionsError(
				`sprite.extraIcons.sources[${i}]`,
				['string'],
				source,
			);
	}

	validateOption('sprite.extraIcons.icons', ['array']);
	for (let i = 0; i < options.sprite.extraIcons.icons.length; i++) {
		const icon = options.sprite.extraIcons.icons[i];
		if (typeof icon !== 'object')
			throw new OptionsError(`sprite.extraIcons.icons[${i}]`, ['object'], icon);
		if (typeof icon.name !== 'string')
			throw new OptionsError(
				`sprite.extraIcons.icons[${i}].name`,
				['string'],
				icon.name,
			);
		if (typeof icon.source !== 'string')
			throw new OptionsError(
				`sprite.extraIcons.icons[${i}].source`,
				['string'],
				icon.source,
			);
	}

	validateOption('sprite.writeFile', ['boolean', 'string']);

	return true;
}
