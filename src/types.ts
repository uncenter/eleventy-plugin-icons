/* eslint-disable @typescript-eslint/ban-types */

/**
 * An object containing attribute-key pairs of strings.
 */
export type Attributes = Record<string, string>;

export type DeepPartial<Thing> = Thing extends Function
	? Thing
	: Thing extends Array<any>
		? Thing
		: Thing extends object
			? DeepPartialObject<Thing>
			: Thing | undefined;

export type DeepPartialObject<Thing> = {
	[Key in keyof Thing]?: DeepPartial<Thing[Key]>;
};

export type Prettify<T> = {
	[K in keyof T]: T extends object ? Prettify<T[K]> : T[K];
} & {};
