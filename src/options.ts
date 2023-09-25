import extend from 'just-extend';

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

export function validateOptions(options: Options): options is Options {
	if (options.mode !== 'inline' && options.mode !== 'sprite') {
		throw new Error(
			`options.mode: expected 'inline' or 'sprite' but received ${typeof options.mode}`,
		);
	}

	if (!Array.isArray(options.sources)) {
		throw new Error(
			`options.sources: expected an array but received ${typeof options.sources}`,
		);
	}
	for (let i = 0; i < options.sources.length; i++) {
		const source = options.sources[i];
		if (typeof source.name !== 'string')
			throw new Error(
				`options.sources[${i}].name: expected a string but received ${typeof source.name}`,
			);
		if (typeof source.path !== 'string')
			throw new Error(
				`options.sources[${i}].path: expected a string but received ${typeof source.path}`,
			);
		if (
			typeof source.default !== 'boolean' &&
			typeof source.default !== 'undefined'
		)
			throw new Error(
				`options.sources[${i}].default: expected boolean or undefined but receieved ${typeof source.default}`,
			);
	}
	if (options.sources.filter((source) => source.default === true).length > 1)
		throw new Error(`options.sources: only one default source is allowed`);

	if (
		[...new Set(options.sources.map((source) => source.name))].length !==
		options.sources.length
	)
		throw new Error('options.sources: source names must be unique');

	if (typeof options.icon !== 'object') {
		throw new Error(
			`options.icon: expected an object but received ${typeof options.icon}`,
		);
	}
	if (typeof options.icon.shortcode !== 'string') {
		throw new Error(
			`options.icon.shortcode: expected a string but received ${typeof options
				.icon.shortcode}`,
		);
	}
	if (typeof options.icon.delimiter !== 'string') {
		throw new Error(
			`options.icon.delimiter: expected a string but received ${typeof options
				.icon.delimiter}`,
		);
	}
	if (typeof options.icon.transform !== 'function') {
		throw new Error(
			`options.icon.transform: expected a function but received ${typeof options
				.icon.transform}`,
		);
	}
	if (typeof options.icon.class !== 'function') {
		throw new Error(
			`options.icon.class: expected a function but received ${typeof options
				.icon.class}`,
		);
	}
	if (typeof options.icon.id !== 'function') {
		throw new Error(
			`options.icon.id: expected a function but received ${typeof options.icon
				.id}`,
		);
	}
	if (
		typeof options.icon.attributes !== 'object' ||
		options.icon.attributes === null
	) {
		throw new Error(
			`options.icon.attributes: expected an object but received ${typeof options
				.icon.attributes}`,
		);
	}
	for (let i = 0; i < Object.entries(options.icon.attributes).length; i++) {
		const [key, value] = Object.entries(options.icon.attributes)[i];
		if (typeof value !== 'string')
			throw new Error(
				`options.icon.attributes['${key}']: expected a string for the value but received ${typeof value}`,
			);
	}
	if (typeof options.icon.attributesBySource !== 'object') {
		throw new Error(
			`options.icon.attributesBySource: expected an object but received ${typeof options
				.icon.attributesBySource}`,
		);
	}
	for (
		let i = 0;
		i < Object.entries(options.icon.attributesBySource).length;
		i++
	) {
		const [key, value] = Object.entries(options.icon.attributesBySource)[i];
		if (typeof value !== 'object')
			throw new Error(
				`options.icon.attributesBySource['${key}']: expected an object for the value but received ${typeof value}`,
			);
		for (let j = 0; j < Object.entries(value).length; j++) {
			const [k, v] = Object.entries(value)[i];
			if (typeof v !== 'string')
				throw new Error(
					`options.icon.attributesBySource['${key}']['${k}']: expected a string for the value but received ${typeof v}`,
				);
		}
	}
	if (typeof options.icon.overwriteExistingAttributes !== 'boolean') {
		throw new Error(
			`options.icon.overwriteExistingAttributes: expected a boolean but received ${typeof options
				.icon.overwriteExistingAttributes}`,
		);
	}
	if (typeof options.icon.errorNotFound !== 'boolean') {
		throw new Error(
			`options.icon.errorNotFound: expected a boolean but received ${typeof options
				.icon.errorNotFound}`,
		);
	}

	if (typeof options.sprite !== 'object') {
		throw new Error(
			`options.sprite: expected an object but received ${typeof options.sprite}`,
		);
	}
	if (typeof options.sprite.shortcode !== 'string') {
		throw new Error(
			`options.sprite.shortcode: expected a string but received ${typeof options
				.sprite.shortcode}`,
		);
	}
	if (typeof options.sprite.attributes !== 'object') {
		throw new Error(
			`options.sprite.attributes: expected an object but received ${typeof options
				.sprite.attributes}`,
		);
	}
	if (typeof options.sprite.extraIcons !== 'object') {
		throw new Error(
			`options.sprite.extraIcons: expected an object but received ${typeof options
				.sprite.extraIcons}`,
		);
	}
	if (typeof options.sprite.extraIcons.all !== 'boolean') {
		throw new Error(
			`options.sprite.extraIcons.all: expected a boolean but received ${typeof options
				.sprite.extraIcons.all}`,
		);
	}
	if (!Array.isArray(options.sprite.extraIcons.sources)) {
		throw new Error(
			`options.sprite.extraIcons.sources: expected an array but received ${typeof options
				.sprite.extraIcons.all}`,
		);
	}
	for (let i = 0; i < options.sprite.extraIcons.sources.length; i++) {
		const source = options.sprite.extraIcons.sources[i];
		if (typeof source !== 'string')
			throw new Error(
				`options.sprite.extraIcons.sources[${i}]: expected a string but received ${typeof source}`,
			);
	}
	if (!Array.isArray(options.sprite.extraIcons.icons)) {
		throw new Error(
			`options.sprite.extraIcons.icons: expected an array but received ${typeof options
				.sprite.extraIcons.all}`,
		);
	}
	for (let i = 0; i < options.sprite.extraIcons.icons.length; i++) {
		const icon = options.sprite.extraIcons.icons[i];
		if (typeof icon !== 'object')
			throw new Error(
				`options.sprite.extraIcons.icons[${i}]: expected an object but received ${typeof icon}`,
			);
		if (typeof icon.name !== 'string')
			throw new Error(
				`options.sprite.extraIcons.icons[${i}].name: expected a string but received ${typeof icon}`,
			);
		if (typeof icon.source !== 'string')
			throw new Error(
				`options.sprite.extraIcons.icons[${i}].source: expected a string but received ${typeof icon}`,
			);
	}
	if (
		typeof options.sprite.writeFile !== 'boolean' &&
		typeof options.sprite.writeFile !== 'string'
	) {
		throw new Error(
			`options.sprite.writeFile: expected a boolean or string but received ${typeof options
				.sprite.writeFile}`,
		);
	}
	return true;
}
