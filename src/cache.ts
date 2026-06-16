const _cache: Record<string, string> = {};

const get = (key: string): string | undefined => _cache[key];

const set = (key: string, value: string): void => {
	_cache[key] = value;
};

function getOrSet(key: string, fn: () => string): string;
function getOrSet(key: string, fn: () => Promise<string>): Promise<string>;
function getOrSet(
	key: string,
	fn: () => string | Promise<string>,
): string | Promise<string> {
	const cached = _cache[key];
	if (cached !== undefined) return cached;
	const result = fn();
	if (result instanceof Promise) {
		return result.then((value) => {
			_cache[key] = value;
			return value;
		});
	}
	_cache[key] = result;
	return result;
}

export const cache = { get, set, getOrSet };
