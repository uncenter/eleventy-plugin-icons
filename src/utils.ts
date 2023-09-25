import kleur from 'kleur';
import type { Attributes } from './types';

export class PluginError extends Error {
	constructor(message: string) {
		super(`[eleventy-plugin-icons] ${message}`);
	}
}

export const log = {
	log(msg: string) {
		message(msg);
	},

	info(msg: string) {
		message(msg, 'warn', 'blue');
	},

	warn(msg: string) {
		message(msg, 'warn', 'yellow');
	},

	error(msg: string) {
		message(msg, 'error', 'red');
	},
};

/**
 * Formats the message to log.
 *
 * @param message The raw message to log.
 * @param type The error level to log.
 */
function message(
	message: string,
	type: 'log' | 'warn' | 'error' = 'log',
	color?: string,
) {
	const prefix = '[eleventy-plugin-icons] ';
	message = `${prefix}${message.split('\n').join(`\n${prefix}`)}`;
	if (color) {
		// @ts-expect-error
		console[type](kleur[color](message));
	} else {
		console[type](message);
	}
}

/**
 * Merges specified attributes from an array of attribute objects and overwrite the rest.
 *
 * @param mergeKeys - An array of attribute keys to combine across the given objects.
 * @param objects - An array of attribute objects to merge. Attributes from objects later in the array overwrite earlier ones.
 */
export function mergeAttributes(
	mergeKeys: string[],
	objects: Attributes[],
): Attributes {
	return objects.reduce((acc, object) => {
		// Combine specified keys.
		mergeKeys.forEach((key) => {
			if (object[key]) {
				acc[key] = acc[key] ? `${acc[key]} ${object[key]}` : object[key];
			}
		});

		// Overwrite/set non-combined keys.
		Object.keys(object).forEach((key) => {
			if (!mergeKeys.includes(key)) {
				acc[key] = object[key];
			}
		});

		return acc;
	}, {});
}

/**
 * Converts an object of attributes into a string suitable for XML tags.
 *
 * @param attrs - An attribute object.
 * @returns A string representation of the attributes in the format key="value".
 */
export function attributesToString(attrs: Attributes): string {
	return Object.entries(attrs)
		.map(([key, value]) => `${key}="${value}"`)
		.join(' ');
}

// https://github.com/fabiospampinato/json-oneline-stringify

// The MIT License (MIT)

// Copyright (c) 2023-present Fabio Spampinato

// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

export function stringify(input: unknown): string | undefined {
	const type = typeof input;

	if (type === 'string' || type === 'number') return JSON.stringify(input);
	if (type === 'boolean') return input ? 'true' : 'false';
	if (type === 'object') {
		if (input === null) {
			return 'null';
		} else if (Array.isArray(input)) {
			let children = '';

			for (let i = 0, l = input.length; i < l; i++) {
				const value = input[i];
				const child = stringify(value);

				if (child === undefined) continue;

				children += children ? `, ${child}` : child;
			}

			return `[${children}]`;
		} else {
			let children = '';

			for (const prop in input) {
				const value = stringify(input[prop as keyof typeof input]);

				if (value === undefined) continue;

				const key = stringify(prop);

				children += children ? `, ${key}: ${value}` : `${key}: ${value}`;
			}

			return children ? `{ ${children} }` : '{}';
		}
	}
}
