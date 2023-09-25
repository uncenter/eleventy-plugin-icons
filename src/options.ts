import extend from 'just-extend';
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
			)} but received ${typeof value}`,
		);
	}
}

class CustomOptionsError extends PluginError {
	constructor(option: string, message: string) {
		super(`options.${option}: ${message}`);
	}
}

export function validateOptions(options: Options): options is Options {
	if (options.mode !== 'inline' && options.mode !== 'sprite') {
		throw new OptionsError('mode', ["'inline'", "'sprite'"], options.mode);
	}

	if (!Array.isArray(options.sources)) {
		throw new OptionsError('sources', ['array'], options.sources);
	}
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

	if (typeof options.icon !== 'object') {
		throw new OptionsError('icon', ['object'], options.icon);
	}
	if (typeof options.icon.shortcode !== 'string') {
		throw new OptionsError(
			'icon.shortcode',
			['string'],
			options.icon.shortcode,
		);
	}
	if (typeof options.icon.delimiter !== 'string') {
		throw new OptionsError(
			'icon.delimiter',
			['string'],
			options.icon.delimiter,
		);
	}
	if (typeof options.icon.transform !== 'function') {
		throw new OptionsError(
			'icon.transform',
			['function'],
			options.icon.transform,
		);
	}
	if (typeof options.icon.class !== 'function') {
		throw new OptionsError('icon.class', ['function'], options.icon.class);
	}
	if (typeof options.icon.id !== 'function') {
		throw new OptionsError('icon.id', ['function'], options.icon.id);
	}
	if (
		typeof options.icon.attributes !== 'object' ||
		options.icon.attributes === null
	) {
		throw new OptionsError(
			'icon.attributes',
			['object'],
			options.icon.attributes,
		);
	}
	for (let i = 0; i < Object.entries(options.icon.attributes).length; i++) {
		const [key, value] = Object.entries(options.icon.attributes)[i];
		if (typeof value !== 'string')
			throw new OptionsError(`icon.attributes['${key}']`, ['string'], value);
	}
	if (typeof options.icon.attributesBySource !== 'object') {
		throw new OptionsError(
			'icon.attributesBySource',
			['object'],
			options.icon.attributesBySource,
		);
	}
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
	if (typeof options.icon.overwriteExistingAttributes !== 'boolean') {
		throw new OptionsError(
			'icon.overwriteExistingAttributes',
			['boolean'],
			options.icon.overwriteExistingAttributes,
		);
	}
	if (typeof options.icon.errorNotFound !== 'boolean') {
		throw new OptionsError(
			'icon.errorNotFound',
			['boolean'],
			options.icon.errorNotFound,
		);
	}

	if (typeof options.sprite !== 'object') {
		throw new OptionsError('sprite', ['object'], options.sprite);
	}
	if (typeof options.sprite.shortcode !== 'string') {
		throw new OptionsError(
			'sprite.shortcode',
			['string'],
			options.sprite.shortcode,
		);
	}
	if (typeof options.sprite.attributes !== 'object') {
		throw new OptionsError(
			'sprite.attributes',
			['object'],
			options.sprite.attributes,
		);
	}
	if (typeof options.sprite.extraIcons !== 'object') {
		throw new OptionsError(
			'sprite.extraIcons',
			['object'],
			options.sprite.extraIcons,
		);
	}
	if (typeof options.sprite.extraIcons.all !== 'boolean') {
		throw new OptionsError(
			'sprite.extraIcons.all',
			['boolean'],
			options.sprite.extraIcons.all,
		);
	}
	if (!Array.isArray(options.sprite.extraIcons.sources)) {
		throw new OptionsError(
			'sprite.extraIcons.sources',
			['array'],
			options.sprite.extraIcons.sources,
		);
	}
	for (let i = 0; i < options.sprite.extraIcons.sources.length; i++) {
		const source = options.sprite.extraIcons.sources[i];
		if (typeof source !== 'string')
			throw new OptionsError(
				`sprite.extraIcons.sources[${i}]`,
				['string'],
				source,
			);
	}
	if (!Array.isArray(options.sprite.extraIcons.icons)) {
		throw new OptionsError(
			'sprite.extraIcons.icons',
			['array'],
			options.sprite.extraIcons.icons,
		);
	}
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
	if (
		typeof options.sprite.writeFile !== 'boolean' &&
		typeof options.sprite.writeFile !== 'string'
	) {
		throw new OptionsError(
			'sprite.writeFile',
			['boolean', 'string'],
			options.sprite.writeFile,
		);
	}
	return true;
}
