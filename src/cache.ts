const _cache: Record<string, string> = {};

const get = (key: string): string | undefined => {
	return _cache[key];
};

const set = (key: string, value: string): void => {
	_cache[key] = value;
};

export const cache = { get, set };
