const Chalk = require('chalk');

class Message {
	error(message) {
		console.log(Chalk.red(`[ERROR] ${message}`));
		process.exit(1);
	}

	warning(message) {
		console.log(Chalk.yellow(`[WARNING] ${message}`));
	}

	deprecated(message) {
		console.log(Chalk.yellow(`[DEPRECATED] ${message}`));
	}

	info(message) {
		console.log(Chalk.blue(`[INFO] ${message}`));
	}
}

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

function stringifyAttributes(attributes) {
	return Object.entries(attributes)
		.map(([key, value]) => `${key}="${value}"`)
		.join(' ');
}

function filterDuplicates(arr) {
	const unique = [];
	arr.forEach((item) => {
		if (!unique.some((element) => JSON.stringify(element) === JSON.stringify(item))) {
			unique.push(item);
		}
	});
	return unique;
}

module.exports = {
	Message,
	mergeOptions,
	stringifyAttributes,
	filterDuplicates,
};
