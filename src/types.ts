/**
 * An object containing attribute-key pairs of strings.
 */
export type Attributes = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type DeepPartial<T> = T extends Function | Array<any>
	? T
	: T extends object
		? { [K in keyof T]?: DeepPartial<T[K]> }
		: T | undefined;

export type Prettify<T> = {
	[K in keyof T]: T extends object ? Prettify<T[K]> : T[K];
} & {};
