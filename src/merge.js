module.exports = (a, b) => {
	return Object.entries(a).reduce((acc, [key, value]) => {
		if (b === undefined) {
			acc[key] = value;
		} else if (b[key] !== undefined) {
			if (value.constructor === Object) {
				acc[key] = Object.assign({}, value, b[key]);
			} else {
				acc[key] = b[key];
			}
		} else {
			acc[key] = value;
		}
		return acc;
	}, {});
};
