import extend from 'just-extend';
import typeOf from 'just-typeof';

import { PluginError } from './error';
import { get } from './utils';

export type Options = {
	mode: 'inline' | 'sprite';
	sources: {
		name: string;
		path: string;
		default?: boolean;
		getFileName?: (icon: string) => string;
	}[];
	icon: {
		shortcode: string;
		shortcodeAsync: string;
		delimiter: string;
		transform: (content: string) => Promise<string> | string;
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
		shortcodeAsync: 'iconAsync',
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
	function validateOption(option: string, expected: any[], literal?: boolean) {
		const value = get(options, option);
		if (literal) {
			if (!expected.includes(value)) {
				throw new OptionsError(
					option,
					expected.map((x) => JSON.stringify(x)),
					value,
				);
			}
		} else {
			if (!expected.includes(typeOf(value))) {
				throw new OptionsError(option, expected, value);
			}
		}
	}

	validateOption('mode', ['inline', 'sprite'], true);
	validateOption('sources', ['array']);
	for (let i = 0; i < options.sources.length; i++) {
		validateOption(`sources[${i}].name`, ['string']);
		validateOption(`sources[${i}].path`, ['string']);
		validateOption(`sources[${i}].default`, ['boolean', 'undefined']);
	}
	if (options.sources.filter((source) => source.default === true).length > 1)
		throw new CustomOptionsError(
			'sources',
			'only one default source is allowed',
		);

	if (
		new Set(options.sources.map((source) => source.name)).size !==
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
	for (const key in options.icon.attributes) {
		validateOption(`icon.attributes['${key}']`, ['string']);
	}
	validateOption('icon.attributesBySource', ['object']);
	for (const [key, value] of Object.entries(options.icon.attributesBySource)) {
		validateOption(`icon.attributesBySource['${key}']`, ['object']);
		for (const k in value) {
			validateOption(`icon.attributesBySource['${key}']['${k}']`, ['string']);
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
		validateOption(`sprite.extraIcons.sources[${i}]`, ['string']);
	}
	validateOption('sprite.extraIcons.icons', ['array']);
	for (let i = 0; i < options.sprite.extraIcons.icons.length; i++) {
		validateOption(`sprite.extraIcons.icons[${i}]`, ['object']);
		validateOption(`sprite.extraIcons.icons[${i}].name`, ['string']);
		validateOption(`sprite.extraIcons.icons[${i}].source`, ['string']);
	}
	validateOption('sprite.writeFile', ['boolean', 'string']);

	return true;
}
