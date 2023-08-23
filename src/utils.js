const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const { Logger } = require('./log');
const log = new Logger(require('../package.json').name);

/**
 * Recursively merges two objects, prioritizing values from the second object (`b`)
 * when keys exist in both objects. If a value is an object (excluding arrays),
 * the function will perform a deep merge.
 *
 * @param {Object} a - The base object to be merged.
 * @param {Object} [b={}] - The object with values to merge into the base object.
 * @returns {Object} - A new object containing the merged properties from both objects.
 */
function merge(a, b = {}) {
	return Object.entries(a).reduce((acc, [key, value]) => {
		if (key in b) {
			if (typeof value === 'object' && !Array.isArray(value)) {
				acc[key] = merge(value, b[key]);
			} else {
				acc[key] = b[key];
			}
		} else {
			acc[key] = value;
		}
		return acc;
	}, {});
}

/**
 * Combines specified attributes from an array of attribute objects and overwrite/set the rest,
 * creating a new object with the attributes.
 *
 * @param {string[]} keysToCombine - An array of keys representing the attributes to combine.
 * @param {Object.<string, string>[]} objects - An array of objects to process.
 * @returns {Object.<string, string>} - A new object with combined attributes based on the specified keys.
 */
function combineAttributes(keysToCombine, objects) {
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
 * @param {Object} attrs - An object containing attribute-key pairs to be converted.
 * @returns {string} - A string representation of attributes in the format key="value".
 */
function attributesToString(attrs) {
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
 * @param {string} raw - The raw SVG string.
 * @param {Object.<string, string>} attributes - The attributes to be added or combined.
 * @param {boolean} overwrite - Flag indicating whether to overwrite existing attributes.
 * @returns {string} The modified SVG string.
 */
function parseSVG(raw, attributes, overwrite) {
	const parsed = parser.parse(raw);
	let svg;
	let existingAttributes = {};
	for (const node of parsed) {
		if ('svg' in node) {
			svg = node.svg;

			if (':@' in node) {
				existingAttributes = node[':@'];
				existingAttributes = Object.keys(existingAttributes).reduce((acc, key) => {
					acc[key.replace(/^@_/, '')] = existingAttributes[key];
					return acc;
				}, {});
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

			node[':@'] = Object.keys(newAttributes).reduce((acc, key) => {
				acc['@_' + key] = newAttributes[key];
				return acc;
			}, {});

			break;
		}
	}
	if (!svg) log.error('No SVG element found.');

	return builder.build(parsed);
}

module.exports = {
	merge,
	combineAttributes,
	attributesToString,
	parseSVG,
};
