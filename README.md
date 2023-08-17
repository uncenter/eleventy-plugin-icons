<h1>eleventy-plugin-icons</h1>

[![Eleventy](https://img.shields.io/badge/Eleventy-2.0.1-333333.svg?style=flat-square)](https://11ty.dev)
[![](https://img.shields.io/npm/v/eleventy-plugin-icons?style=flat-square&color=red)](https://npmjs.com/package/eleventy-plugin-icons)

Add icons to your Eleventy site, made easy.

Turn an [11ty shortcode](https://www.11ty.dev/docs/shortcodes/) like this:

```twig
{% icon "star" %}
```

Into an SVG like this, right in your templates:

<!-- prettier-ignore -->
```html
<svg class="icon icon-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
```

You can also change/set attributes on an icon right in the shortcode:

```twig
{% icon "star", { "stroke": "#ed8a19" } %}
```

Or you can set attributes for all icons:

```js
{
    icon: {
        attributes: {
            width: "50",
            height: "50"
        },
    }
}
```

And best of all, you can add any directory as a source for your icons, including icons from packages (in `node_modules`, see [Popular icon sets](#popular-icon-sets)).

## Getting started

```sh
npm i eleventy-plugin-icons
pnpm add eleventy-plugin-icons
yarn add eleventy-plugin-icons
```

To enable the plugin with 11ty, you need to add the following to your [11ty configuration file](https://www.11ty.dev/docs/config/#default-filenames).

```js
const pluginIcons = require('eleventy-plugin-icons');

module.exports = (eleventyConfig) => {
	eleventyConfig.addPlugin(pluginIcons, {});
};
```

To give you an idea of the level of customization this plugin offers, take a look at the base configuration. If that looks intimidating, you can [just skip to the first step](#adding-a-source).

```js
{
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
}
```

### Adding a source

To get started, you need a source to pull the icons from. For example, if you have some custom icons in the `src/icons` directory, you can add those as a source like so:

```js
{
	sources: [{ name: 'custom', path: './src/icons' }];
}
```

Now in your templates you can insert your icons using the `icon` shortcode.

```twig
{% icon "custom:my-icon" %}
```

If that syntax looks too ugly for you, or if you only have one source, you can make it the default source. With a default source, icons can be used like `{% icon "my-icon" %}` instead of `{% icon "custom:my-icon" %}`.

```js
{ name: 'custom', path: './src/icons', default: true }
```

#### Popular icon sets

There are no sources defined out of the box, but here are some popular icon sets for reference:

|                                      | Package                                                      | Icons Directory                         |
| ------------------------------------ | ------------------------------------------------------------ | --------------------------------------- |
| [Lucide](https://lucide.dev/)        | [lucide-static](https://www.npmjs.com/package/lucide-static) | `node_modules/lucide-static/icons`      |
| [Tabler](https://tabler-icons.io/)   | [@tabler/icons](https://www.npmjs.com/package/@tabler/icons) | `node_modules/@tabler/icons/icons`      |
| [Feather](https://feathericons.com/) | [feather-icons](https://www.npmjs.com/package/feather-icons) | `node_modules/feather-icons/dist/icons` |

To use icons from a package, install the package and define the source in `sources`. For example, to use a source called `lucide` that points to the icons in `node_modules/lucide-static/icons`:

```sh
npm i lucide-static
```

```js
{
    sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
}
```

### Changing attributes

By default, the plugin uses the icon name as the ID and class of the inserted icon. For example, the `heart` icon from any source would have the following class and ID:

```html
<svg class="icon icon-heart" id="icon-heart"></svg>
```

To change this, you can use the `icon.id` and `icon.class` functions. For example, the following would change the class and ID to include the source name:

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

This would lead to the following class and ID for the `heart` icon from the `custom` source:

```html
<svg class="icon icon-custom-heart" id="icon-custom-heart"></svg>
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

> **Note**
>
> See [Adding a source](#adding-a-source).

The `sources` option is an array of source objects; `[{ name: '', path: '', default?: true | false }]`. The source name is used in the shortcode (e.g. the word `custom` in `custom:my-icon`), and the path is the directory of the SVGs.

To make a source the default source, set the `default` property to `true`.

```js
{ name: 'custom', path: './src/icons', default: true }
```

### icon

|                               | Default                       | Values                                         | Description                                                                                                                                                                                            |
| ----------------------------- | ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shortcode`                   | `'icon'`                      | string                                         | The shortcode name (e.g. `{% icon %}`) used to insert the icon.                                                                                                                                        |
| `delimiter`                   | `:`                           | string                                         | The delimiter between the source and icon name (e.g. `:` in `custom:my-icon`).                                                                                                                         |
| `transform`                   | [_see below_](#icontransform) | `async function (content) { return content 		};` | Transform/modify raw content from SVG before attribute manipulation.                                                                                                                                   |
| `class`                       | [_see below_](#iconclass)     |                                                | Dynamic `class` of the inserted icon (e.g. `class="icon icon-my-icon"`). Define a function that takes in the icon name and source and returns a string.                                                |
| `id`                          | [_see below_](#iconid)        |                                                | Dynamic `id` of sprite icons (e.g. `id="icon-my-icon"`), the `href` of sprite references (e.g. `href="#icon-my-icon"`). Define a function that takes in the icon name and source and returns a string. |
| `attributes`                  | `{}`                          |                                                | Set icon attributes: `{ 'aria-hidden': 'true' }` would set `aria-hidden="true"`.                                                                                                                       |
| `attributesBySource`          | `{}`                          |                                                | Set icon attributes per-class: `{ custom: { 'aria-hidden': 'true' } }` would set `aria-hidden="true"` if the source is `custom`.                                                                       |
| `overwriteExistingAttributes` | `true`                        | `true`, `false`                                | Override existing attributes on the original SVG. If `true`, existing attributes will be replaced with supplied attributes. If `false`, existing attributes will be kept.                              |
| `errorNotFound`               | `true`                        | `true`, `false`                                | Warn instead of error on icons that are not found. If `true`, an error will be thrown. If `false`, only a warning will be shown.                                                                       |

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

If `all` is set to `true`, all icons from every source will be inserted into the sprite sheet, even if they are not used in the page. If `sources` is set, all icons from the source names in `sources` will be inserted, even if they are not used in the page. If `icons` is set, you can provide an array of icon objects, `{ name: '', source: '' }`, to be inserted.

## Credits

- [eleventy-plugin-template](https://github.com/5t3ph/eleventy-plugin-template)

## License

[MIT](LICENSE)
