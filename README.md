<h1>eleventy-plugin-icons</h1>

[![Eleventy](https://img.shields.io/badge/Eleventy-2.0.1-333333.svg?style=flat-square)](https://11ty.dev)
[![](https://img.shields.io/npm/v/eleventy-plugin-icons?style=flat-square&color=red)](https://npmjs.com/package/eleventy-plugin-icons)

An simple but customizable plugin to add icons to your Eleventy project.

## Install

```sh
npm i eleventy-plugin-icons
pnpm add eleventy-plugin-icons
yarn add eleventy-plugin-icons
```

## Usage

```js
const pluginIcons = require('eleventy-plugin-icons');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons);
};
```

## Configuration

| Option                | Default             |
| --------------------- | ------------------- |
| [`mode`](#mode)       | `'inline'`          |
| [`sources`](#sources) | `[]`                |
| [`icon`](#icon)       | _see section below_ |
| [`sprite`](#sprite)   | _see section below_ |

### mode

The `mode` option can be either `inline` or `sprite`. If `inline` is used, the `icon` shortcode will insert the SVG directly into the page (no "sprite sheet" required). If `sprite` is used, using the `icon` shortcode will instead insert a `<use>` reference for each icon, and should be used in conjunction with the `sprites` shortcode.

### sources

The `sources` option is an array of source objects; `[{ name: '', path: '', default?: true | false }]`. The source name is used in the shortcode (e.g. `custom` in `custom:icon`), and the path is the directory of the SVGs. For example, if you wanted to add a source called `custom` that points to the `src/icons` directory, you would use the following:

```js
{
	sources: [{ name: 'custom', path: './src/icons' }];
}
```

To make a source the default source, set the optional `default` property to `true`. With a default source, icons can be used like `{% icon "heart" %}` instead of `{% icon "custom:heart" %}`.

```js
{ name: 'custom', path: './src/icons', default: true }
```

There are no sources defined by default, but here are some popular ones for reference:

|                                      | Package                                                      | Icons Directory                           |
| ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------- |
| [Tabler](https://tabler-icons.io/)   | [@tabler/icons](https://www.npmjs.com/package/@tabler/icons) | `"node_modules/@tabler/icons/icons"`      |
| [Lucide](https://lucide.dev/)        | [lucide-static](https://www.npmjs.com/package/lucide-static) | `"node_modules/lucide-static/icons"`      |
| [Feather](https://feathericons.com/) | [feather-icons](https://www.npmjs.com/package/feather-icons) | `"node_modules/feather-icons/dist/icons"` |

To use icons from a package, install the package and define the source in `sources`. For example, to use a source called `tabler` that points to the icons in `node_modules/@tabler/icons/icons`:

```sh
npm i @tabler/icons
```

```js
{
    sources: [{ name: 'tabler', path: 'node_modules/@tabler/icons/icons' }],
}
```

### icon

|                               | Default                       | Values                                         | Description                                                                                                                                                                                        |
| ----------------------------- | ----------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shortcode`                   | `'icon'`                      | string                                         | The shortcode name (e.g. `{% icon %}`) used to insert the icon.                                                                                                                                    |
| `delimiter`                   | `:`                           | string                                         | The delimiter between the source and icon name (e.g. `:` in `custom:heart`).                                                                                                                       |
| `transform`                   | [_see below_](#icontransform) | `async function (content) { return content 		};` | Transform/modify raw content from SVG before attribute manipulation.                                                                                                                               |
| `class`                       | [_see below_](#iconclass)     |                                                | Dynamic `class` of the inserted icon (e.g. `class="icon icon-heart"`).Define a function that takes in the icon name and source and returns a string.                                               |
| `id`                          | [_see below_](#iconid)        |                                                | Dynamic `id` of sprite icons (e.g. `id="icon-heart"`), the `href` of sprite references (e.g. `href="#icon-heart"`). Define a function that takes in the icon name and source and returns a string. |
| `attributes`                  | `{}`                          |                                                | Set icon attributes: `{ 'aria-hidden': 'true' }` would set `aria-hidden="true"`.                                                                                                                   |
| `attributesBySource`          | `{}`                          |                                                | Set icon attributes per-class: `{ custom: { 'aria-hidden': 'true' } }` would set `aria-hidden="true"` if the source is `custom`.                                                                   |
| `overwriteExistingAttributes` | `true`                        | `true`, `false`                                | Override existing attributes on the original SVG. If `true`, existing attributes will be replaced with supplied attributes. If `false`, existing attributes will be kept.                          |
| `errorNotFound`               | `true`                        | `true`, `false`                                | Warn instead of error on icons that are not found. If `true`, an error will be thrown. If `false`, only a warning will be shown.                                                                   |

#### icon.class

By default, the class of the inserted icon is `icon icon-{name}`, using the following function:

```js
function (name, source) {
    return `icon icon-${name}`;
}
```

#### icon.id

By default, the ID of the inserted icon is `icon-{name}`, using the following function:

```js
function (name, source) {
    return `icon-${name}`;
}
```

### sprite

| Option       | Default                                                                                  | Values            | Description                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `shortcode`  | `'spriteSheet'`                                                                          | string            | The shortcode name (e.g. `{% spriteSheet %}`) used to insert the sprite sheet. It takes no arguments. Used when `mode` is set to `sprite`. |
| `class`      | `'sprite-sheet'`                                                                         | string            | The class of the inserted sprite SVG.                                                                                                      |
| `attributes` | `{ "class: "sprite-sheet", "aria-hidden": "true", xmlns: 'http://www.w3.org/2000/svg' }` |                   | Attributes set on the sprite SVG.                                                                                                          |
| `extraIcons` | [_see below_](#extraicons)                                                               |                   | Add additional icons not directly used in your content                                                                                     |
| `writeFile`  | `false`                                                                                  | `string`, `false` | Write the generated sprite SVG to specified path in the 11ty output directory. Disable by setting it to `false`.                           |

#### sprite.extraIcons

```js
{
    all: false,
    sources: [],
    icons: [],
};
```

If `all` is set to `true`, all icons from every source will be inserted into the sprite sheet (even if they are not used in the page). If `sources` is set, all icons from the source names in `sources` will be inserted, even if they are not used in the page. If `icons` is set, you can provide an array of icon objects, `{ name: '', source: '' }`, to be inserted.

## Usage examples

Shown are the default values for each option.

```js
const pluginIcons = require('eleventy-plugin-icons');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons, {
		mode: 'inline', // 'inline' | 'sprite'
		sources: [], // [ { name: '', path: '', default?: true | false }, ... ]
		icon: {
			shortcode: 'icon', // string
			delimiter: ':', // string
			class: function (name, source) {
				return `icon icon-${name}`;
			},
			id: function (name, source) {
				return `icon-${name}`;
			},
			attributes: {}, // { 'attribute': 'value', ... }
			attributesBySource: {}, // { 'source': { 'attribute': 'value', ... }, ... }
			overwriteExistingAttributes: true, // true | false
			errorNotFound: true, // true | false
		},
		sprite: {
			shortcode: 'spriteSheet', // string
			attributes: {
				// { 'attribute': 'value', ... }
				class: 'sprite-sheet',
				'aria-hidden': 'true',
				xmlns: 'http://www.w3.org/2000/svg',
			},
			extraIcons: {
				all: false, // true | false
				sources: [], // ['', '', '']
				icons: [], // [ { name: '', source: '' }]
			},
			writeFile: false, // false | 'path/to/file'
		},
	});
};
```

### Using a custom naming pattern

By default, the plugin uses the icon name as the ID and class of the inserted icon. For example, the `heart` icon from any source would have the following class and ID:

```html
<svg class="icon icon-heart" id="icon-heart"></svg>
```

If you want to change this, you can use the `icon.id` and `icon.class` options. For example, the following would change the class and ID to include the source name:

```js
 {
    // ...
    icon: {
        class: function (name, source) {
            return `icon icon-${source}-${name}`;
        },
        id: function (name, source) {
            return `icon-${source}-${name}`;
        },
    },
}
```

This would lead to the following class and ID for the `heart` icon from the `custom` source, for example:

```html
<svg class="icon icon-custom-heart" id="icon-custom-heart"></svg>
```

## Credits

- [eleventy-plugin-template](https://github.com/5t3ph/eleventy-plugin-template)

## License

[MIT](LICENSE)
