function reduceAttrs({ keysToCombine, objects }) {
	return objects.reduce((acc, object) => {
		keysToCombine.forEach((key) => {
			if (object[key]) {
				acc[key] = acc[key] ? `${acc[key]} ${object[key]}` : object[key];
			}
		});

		Object.keys(object).forEach((key) => {
			if (!keysToCombine.includes(key)) {
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

module.exports = {
	reduceAttrs,
	attrsToString,
	filterArrayDuplicates,
};
