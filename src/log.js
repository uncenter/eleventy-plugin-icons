const { bgCyan, bgBlue, bgYellow, bgRed, gray } = require('kleur/colors');

/**
 * Represents a logger for logging messages with different log levels and color-coded formatting.
 */
class Logger {
	/**
	 * Create a new Logger instance.
	 * @param {string} prefix - A prefix to be added to each log message. Optional.
	 * @param {Object} options - Options for configuring the logger.
	 * @param {string[]} options.levels - An array of log levels to display. Default: ['debug', 'info', 'warn', 'error'].
	 * @param {boolean} options.throwError - Whether to throw an error for 'error' level logs. Default: true.
	 */
	constructor(prefix, options = {}) {
		this.prefix = prefix || '';
		this.levels = options.levels || ['debug', 'info', 'warn', 'error'];
		this.throwError = options.throwError || true;
	}

	/**
	 * Log a message with the specified level.
	 * @param {string} level - The log level ('debug', 'info', 'warn', 'error').
	 * @param {string} message - The message to be logged.
	 * @private
	 */
	log(level, message) {
		const colors = {
			debug: bgCyan,
			info: bgBlue,
			warn: bgYellow,
			error: bgRed,
		};

		if (this.levels.includes(level)) {
			message = `${this.prefix ? gray('[') + this.prefix + gray(']') + ' ' : ''}${colors[level](
				` ${level.toUpperCase()} `,
			)} ${message}`;
			console.log(message);
		}
	}

	/**
	 * Log a debug message.
	 * @param {...string} messages - The messages to be logged.
	 */
	debug(...messages) {
		this.log('debug', messages.join(' '));
	}

	/**
	 * Log an informational message.
	 * @param {...string} messages - The messages to be logged.
	 */
	info(...messages) {
		this.log('info', messages.join(' '));
	}

	/**
	 * Log a warning message.
	 * @param {...string} messages - The messages to be logged.
	 */
	warn(...messages) {
		this.log('warn', messages.join(' '));
	}

	/**
	 * Log an error message. Optionally throw an error.
	 * @param {...string} messages - The messages to be logged.
	 * @throws {Error} An Error object with the logged error message if throwError is enabled.
	 */
	error(...messages) {
		messages = messages.join(' ');
		this.log('error', messages);

		if (this.throwError) {
			const error = new Error(messages);
			Error.captureStackTrace(error, Logger.prototype.error);
			throw error;
		}
	}
}

module.exports = { Logger };
