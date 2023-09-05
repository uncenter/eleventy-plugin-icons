import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { Logger } from 'loogu';
import { PluginOptions, defaultOptions } from './options';
import extend from 'just-extend';
import { Attributes } from './types';

export const log = new Logger('eleventy-plugin-icons');

/**
 * Combines specified attributes from an array of attribute objects and overwrite/set the rest,
 * creating a new object with the attributes.
 *
 * @param keysToCombine - An array of keys representing the attributes to combine.
 * @param objects - An array of objects to process.
 * @returns A new object with combined attributes based on the specified keys.
 */
export function combineAttributes(keysToCombine: string[], objects: Attributes[]): Attributes {
	return objects.reduce((acc, object) => {
		// Combine specified keys.
		keysToCombine.forEach((key) => {
			if (object[key]) {
				acc[key] = acc[key] ? `${acc[key]} ${object[key]}` : object[key];
			}
		});

		// Overwrite/set non-combined keys.
		Object.keys(object).forEach((key) => {
			if (!keysToCombine.includes(key)) {
				acc[key] = object[key];
			}
		});

		return acc;
	}, {});
}

/**
 * Converts an object of attributes into a string for HTML tags.
 *
 * @param attrs - An object containing attribute-key pairs to be converted.
 * @returns A string representation of attributes in the format key="value".
 */
export function attributesToString(attrs: Attributes): string {
	return Object.entries(attrs)
		.map(([key, value]) => `${key}="${value}"`)
		.join(' ');
}

const parser = new XMLParser({
	ignoreAttributes: false,
	ignoreDeclaration: true,
	commentPropName: '#comment',
	preserveOrder: true,
});

const builder = new XMLBuilder({
	ignoreAttributes: false,
	commentPropName: '#comment',
	preserveOrder: true,
	format: true,
	suppressEmptyNode: true,
	unpairedTags: ['hr', 'br', 'link', 'meta'],
});

/**
 * Parses an SVG string, merges given attributes with existing ones, and returns the modified SVG string.
 *
 * @param raw - The raw SVG string.
 * @param attributes - The attributes to be added or combined.
 * @param overwrite - Flag indicating whether to overwrite existing attributes.
 * @returns The modified SVG string.
 */
export function parseSVG(raw: string, attributes: Attributes, overwrite: boolean) {
	const parsed = parser.parse(raw);
	let svg;
	let existingAttributes: Attributes = {};
	for (const node of parsed) {
		if ('svg' in node) {
			svg = node.svg;

			if (':@' in node) {
				existingAttributes = node[':@'];
				existingAttributes = Object.keys(existingAttributes).reduce(
					(acc: typeof existingAttributes, key) => {
						acc[key.replace(/^@_/, '')] = existingAttributes[key];
						return acc;
					},
					{},
				);
			}

			let newAttributes = combineAttributes(
				// Combine given attributes with existing ones depending on `overwrite`.
				overwrite
					? // Overwrite all:
					  []
					: // Combine all:
					  [...new Set([existingAttributes, attributes].flatMap((obj) => Object.keys(obj)))],
				// Existing attributes will be overwritten by newer ones because `attributes` is after `existingAttributes`.
				[existingAttributes, attributes],
			);

			node[':@'] = Object.keys(newAttributes).reduce((acc: typeof newAttributes, key) => {
				acc['@_' + key] = newAttributes[key];
				return acc;
			}, {});

			break;
		}
	}
	if (!svg) log.error('No SVG element found.');

	return builder.build(parsed);
}

export function mergeOptions(options: PluginOptions): PluginOptions {
	return extend(true, defaultOptions, options) as PluginOptions;
}
