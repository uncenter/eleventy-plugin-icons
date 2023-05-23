const fs = require('fs/promises');

function mergeOptions(defaults, options) {
	return Object.entries(defaults).reduce((acc, [key, value]) => {
		if (options === undefined) {
			acc[key] = value;
		} else if (options[key] !== undefined) {
			if (value.constructor === Object) {
				acc[key] = Object.assign({}, value, options[key]);
			} else {
				acc[key] = options[key];
			}
		} else {
			acc[key] = value;
		}
		return acc;
	}, {});
}

function reduceAttrs(attrKeysToCombine, ...objects) {
	return objects.reduce((acc, object) => {
		attrKeysToCombine.forEach((key) => {
			if (object[key]) {
				acc[key] = acc[key] ? `${acc[key]} ${object[key]}` : object[key];
			}
		});

		Object.keys(object).forEach((key) => {
			if (!attrKeysToCombine.includes(key)) {
				acc[key] = object[key];
			}
		});

		return acc;
	}, {});
}

function attrsToString(attributes) {
	return Object.entries(attributes)
		.map(([key, value]) => `${key}="${value}"`)
		.join(' ');
}

function filterArrayDuplicates(arr) {
	const unique = [];
	if (!arr || !Array.isArray(arr)) {
		return unique;
	}
	arr.forEach((item) => {
		if (!unique.includes(item)) {
			unique.push(item);
		}
	});
	return unique;
}

async function fileExists(filePath) {
	return fs
		.stat(filePath)
		.then(() => true)
		.catch(() => false);
}

module.exports = {
	mergeOptions,
	reduceAttrs,
	attrsToString,
	filterArrayDuplicates,
	fileExists,
};
