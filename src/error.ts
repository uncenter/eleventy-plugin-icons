export class PluginError extends Error {
	constructor(message: string) {
		super(`[eleventy-plugin-icons] ${message}`);
	}
}
