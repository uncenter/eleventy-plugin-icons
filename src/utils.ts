import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { Logger } from 'loogu';
import type { Attributes } from './types';

export const log = new Logger('eleventy-plugin-icons');

/**
 * Merges specified attributes from an array of attribute objects and overwrite the rest.
 *
 * @param mergeKeys - An array of attribute keys to combine across the given objects.
 * @param objects - An array of attribute objects to merge. Attributes from objects later in the array overwrite earlier ones.
 */
export function mergeAttributes(
	mergeKeys: string[],
	objects: Attributes[],
): Attributes {
	return objects.reduce((acc, object) => {
		// Combine specified keys.
		mergeKeys.forEach((key) => {
			if (object[key]) {
				acc[key] = acc[key] ? `${acc[key]} ${object[key]}` : object[key];
			}
		});

		// Overwrite/set non-combined keys.
		Object.keys(object).forEach((key) => {
			if (!mergeKeys.includes(key)) {
				acc[key] = object[key];
			}
		});

		return acc;
	}, {});
}

/**
 * Converts an object of attributes into a string suitable for XML tags.
 *
 * @param attrs - An attribute object.
 * @returns A string representation of the attributes in the format key="value".
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
 * Parses an SVG string and merges given attributes with existing ones.
 *
 * @param raw - The raw SVG string.
 * @param attributes - The attributes to be merged.
 * @param overwrite - Flag indicating whether to overwrite existing attributes.
 * @returns The modified SVG string.
 */
export function parseSVG(
	raw: string,
	attributes: Attributes,
	overwrite: boolean,
) {
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

			let newAttributes = mergeAttributes(
				// Combine given attributes with existing ones depending on `overwrite`.
				overwrite
					? // Overwrite all:
					  []
					: // Combine all:
					  [
							...new Set(
								[existingAttributes, attributes].flatMap((obj) =>
									Object.keys(obj),
								),
							),
					  ],
				// Existing attributes will be overwritten by newer ones because `attributes` is after `existingAttributes`.
				[existingAttributes, attributes],
			);

			node[':@'] = Object.keys(newAttributes).reduce(
				(acc: typeof newAttributes, key) => {
					acc['@_' + key] = newAttributes[key];
					return acc;
				},
				{},
			);

			break;
		}
	}
	if (!svg) log.error('No SVG element found.');

	return builder.build(parsed);
}
