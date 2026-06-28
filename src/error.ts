export class PluginError extends Error {
	constructor(message: string, cause?: unknown) {
		super(`[eleventy-plugin-icons] ${message}`, { cause });
	}
}
