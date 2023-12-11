import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { Attributes } from './types';
import { log, mergeAttributes } from './utils';

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
					(accumulator: typeof existingAttributes, key) => {
						accumulator[key.replace(/^@_/, '')] = existingAttributes[key];
						return accumulator;
					},
					{},
				);
			}

			const newAttributes = mergeAttributes(
				// Combine given attributes with existing ones depending on `overwrite`.
				overwrite
					? // Overwrite all:
						[]
					: // Combine all:
						[
							...new Set(
								[existingAttributes, attributes].flatMap((object) =>
									Object.keys(object),
								),
							),
						],
				// Existing attributes will be overwritten by newer ones because `attributes` is after `existingAttributes`.
				[existingAttributes, attributes],
			);

			node[':@'] = Object.keys(newAttributes).reduce(
				(accumulator: typeof newAttributes, key) => {
					accumulator['@_' + key] = newAttributes[key];
					return accumulator;
				},
				{},
			);

			break;
		}
	}
	if (!svg) log.error('No SVG element found.');

	return builder.build(parsed);
}
