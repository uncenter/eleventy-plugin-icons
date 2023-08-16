const { bgCyan, bgBlue, bgYellow, bgRed, gray } = require('kleur/colors');

class Logger {
	constructor(prefix, options = {}) {
		this.prefix = prefix || '';
		this.levels = options.levels || ['debug', 'info', 'warn', 'error'];
	}

	log(level, message) {
		const colors = {
			debug: bgCyan,
			info: bgBlue,
			warn: bgYellow,
			error: bgRed,
		};

		if (this.levels.includes(level)) {
			message = `${this.prefix ? gray('<') + this.prefix + gray('>') + ' ' : ''}${colors[level](` ${level.toUpperCase()} `)} ${message}`;
			console.log(message);
		}
	}

	debug(message) {
		this.log('debug', message);
	}

	info(message) {
		this.log('info', message);
	}

	warn(message) {
		this.log('warn', message);
	}

	error(message) {
		this.log('error', message);
		throw new Error('');
	}
}

module.exports = { Logger };
