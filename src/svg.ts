import type { Attributes } from './types';

import { isElementNode } from 'txml';
import { parse, stringify } from 'txml/txml';

import { cache } from './cache';
import { log, mergeAttributes } from './utils';

/**
 * Parses an SVG string and merges given attributes with existing ones.
 *
 * @param path - The file system path for the icon, for caching.
 * @param raw - The raw SVG string.
 * @param attributes - The attributes to be merged.
 * @param overwrite - Flag indicating whether to overwrite existing attributes.
 * @returns The modified SVG string.
 */
export function processXMLIcon(
	path: string,
	raw: string,
	attributes: Attributes,
	overwrite: boolean,
) {
	const processedIconKey = `processedIcon-${path}-${JSON.stringify(attributes)}-${overwrite}`;

	const maybe = cache.get(processedIconKey);
	if (maybe !== undefined) return maybe;

	const processed = _processXMLIcon(raw, attributes, overwrite);
	cache.set(processedIconKey, processed);
	return processed;
}

/**
 * **INTERNAL: Uncached helper method.**
 *
 * Parses an SVG string and merges given attributes with existing ones.
 *
 * @param raw - The raw SVG string.
 * @param attributes - The attributes to be merged.
 * @param overwrite - Flag indicating whether to overwrite existing attributes.
 * @returns The modified SVG string.
 */
export const _processXMLIcon = (
	raw: string,
	attributes: Attributes,
	overwrite: boolean,
): string => {
	const parsed = parse(raw, {
		keepComments: true,
		keepWhitespace: true,
	});
	let foundSvgNode = false;
	for (const node of parsed) {
		if (isElementNode(node) && node.tagName === 'svg') {
			const existingAttributes: Attributes = node.attributes;

			const newAttributes = mergeAttributes(
				// Combine given attributes with existing ones depending on `overwrite`.
				overwrite
					? // Overwrite all:
						[]
					: // Combine all:
						Object.keys({ ...existingAttributes, ...attributes }),
				// Existing attributes will be overwritten by newer ones because `attributes` is after `existingAttributes`.
				[existingAttributes, attributes],
			);

			node.attributes = { ...newAttributes };

			foundSvgNode = true;
			break;
		}
	}
	if (!foundSvgNode) log.error('No SVG element found.');

	return stringify(parsed);
};
