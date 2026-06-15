export class PluginError extends Error {
	constructor(message: string, cause?: Error) {
		super(`[eleventy-plugin-icons] ${message}`, { cause });
	}
}
