import { type IconObject } from './icon';
import type { Attributes } from './types';

export type PluginOptions = {
	mode: 'inline' | 'sprite';
	sources: Array<{ name: string; path: string; default?: boolean }>;
	icon: {
		shortcode: string;
		delimiter: string;
		transform: (content: string) => Promise<string>;
		class: (name: string, source: string) => string;
		id: (name: string, source: string) => string;
		attributes: Attributes;
		attributesBySource: Record<string, Attributes>;
		overwriteExistingAttributes: boolean;
		errorNotFound: boolean;
	};
	sprite: {
		shortcode: string;
		attributes: Attributes;
		extraIcons: {
			all: boolean;
			sources: string[];
			icons: Array<IconObject>;
		};
		writeFile: false | string;
	};
};

export const defaultOptions: PluginOptions = {
	mode: 'inline',
	sources: [],
	icon: {
		shortcode: 'icon',
		delimiter: ':',
		transform: async (content) => content,
		class: (name) => `icon icon-${name}`,
		id: (name) => `icon-${name}`,
		attributes: {},
		attributesBySource: {},
		overwriteExistingAttributes: true,
		errorNotFound: true,
	},
	sprite: {
		shortcode: 'spriteSheet',
		attributes: {
			class: 'sprite-sheet',
			'aria-hidden': 'true',
			xmlns: 'http://www.w3.org/2000/svg',
		},
		extraIcons: {
			all: false,
			sources: [],
			icons: [],
		},
		writeFile: false,
	},
};
