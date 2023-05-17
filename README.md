<div align="center">
	<h1>eleventy-plugin-icons</h1>
	<img alt="version" src="https://img.shields.io/npm/v/eleventy-plugin-icons?style=for-the-badge&color=red">
	<img alt="downloads" src="https://img.shields.io/npm/dt/eleventy-plugin-icons?style=for-the-badge&color=blueviolet">
   	<img alt="license" src="https://img.shields.io/npm/l/eleventy-plugin-icons?style=for-the-badge&color=g">
	<p></p>
	<p>An easy to use and effective plugin to add icons to your Eleventy project.</p> 
</div>

## Usage

Install via npm:

```sh
npm install eleventy-plugin-icons
```

Then, include it in your `.eleventy.js` config file:

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons);
};
```

See the [Config Options](#config-options) section below or the [Config Examples](#config-examples) section for more info on the configuration options.

## Config Options

| Option | Type | Default | Values |
| --- | --- | --- | --- |
| [`mode`](#mode) | `string` | `sprite` | `sprite`, `inline` |
| [`sources`](#sources) | `object` | - | any |
| [`default`](#default) | `string` or `false` | `false` | `false` or any source defined in `sources` |
| [`optimize`](#optimize) | `boolean` | `false` | `true`, `false` |
| [`SVGO`](#svgo-options) | `string` | `svgo.config.js` | any |
| [`icon`](#icon) | `object` | *see below* | *see below* |
| [`sprites`](#sprites) | `object` | *see below* | *see below* |

### mode

The mode option can be either `sprite` or `inline`. If `sprite` is used, using the shortcode defined in the `icon` option will insert a `<use>` reference for each icon (used in conjunction with the `sprites` shortcode). If `inline` is used, the shortcode will insert the SVG directly into the page (no sprite sheet required).

### sources

The `sources` option is an object of source names and paths. The source name is used in the shortcode (e.g. `custom` in `custom:icon`), and the path is the location of the SVG files. For example, if you wanted to add a source called `custom` that points to the `icons` directory in the `src` folder of your project, you would use the following:

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons, {
        sources: {
            "custom": "./src/icons"
        },
    });
};
```

There are no sources defined by default, but here are some popular ones for reference:

| | NPM Package | Path to Icons |
| --- | --- | --- |
| [Tabler](https://tabler-icons.io/) | [@tabler/icons](https://www.npmjs.com/package/@tabler/icons) | `"node_modules/@tabler/icons/icons"` |
| [Lucide](https://lucide.dev/) | [lucide-static](https://www.npmjs.com/package/lucide-static) | `"node_modules/lucide-static/icons"` |
| [Feather](https://feathericons.com/) | [feather-icons](https://www.npmjs.com/package/feather-icons) | `"node_modules/feather-icons/dist/icons"` |

> **Note**
>
> Feather Icons hasn't been updated in a while, so it's recommended to use the popular and consistently updated fork [Lucide](https://lucide.dev/) instead.

To use icons from a package like above, install the package and define the source in the config file. For example, to use a source called `"tabler"` that points to the `icons` directory in the `node_modules/@tabler/icons` folder, you would use the following:

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons, {
        sources: {
            "tabler": "node_modules/@tabler/icons/icons"
        },
    });
};
```

### default

The default source for icons without a specified source (e.g. using `{% icon "heart" %}` instead of `{% icon "custom:heart" %}`). Any source defined in the `sources` option can be used. If `false`, no default source will be used (an error will be thrown if no source is specified).

### optimize

The optimize option can be used to optimize the SVG using [svgo](https://github.com/svg/svgo).

#### SVGO Options

To configure the options, create a `svgo.config.js` file in the root of your project and it will be automatically loaded (by default, it will look for a `svgo.config.js` file in the root of your project). Alternatively, you can use the `SVGO` option to specify a custom path to the config file.

### icon

| Option | Default | Values | Description |
| --- | --- | --- | --- |
| `shortcode` | `"icon"` | any |The shortcode name (e.g. `{% icon %}`) to insert the icon. |
| `delimiter` | `:` | `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `+`, `=`, `\|`, `:`, `;`, `<`, `>`, `.`, `?`, `/`, or `~` |The delimiter between the source and icon name (e.g. `:` in `custom:heart`). |
| `class` | *see below* | | The class of the inserted icon (e.g. `class="icon icon-heart"`) on the inlined icon. Define a function that takes in the icon name and source and returns the class. |
| `id` | *see below* | | The ID of sprite icons (e.g. `id="icon-heart"`)/the `xlink:href` of sprite references (e.g. `href="#icon-heart"`). Define a function that takes in the icon name and source and returns the ID. |
| `insertAttributes` | `{}` | | The attributes to insert in icons; `'aria-hidden': 'true'` would insert `aria-hidden="true"` in the icon. |
| `insertAttributesBySource` | `{}` | | The attributes to insert in icons by source; `custom: { 'aria-hidden': 'true' }` would insert `aria-hidden="true"` in the icon if the source is `custom`. |
| `overwriteExistingAttributes` | `true` | `true`, `false`, list of attributes | Whether to override existing attributes on an icon. If `true`, existing attributes will be replaced with custom attributes. If `false`, existing attributes will be kept. If a list of attributes is specified, only those attributes will be overwritten. |
| `ignoreNotFound` | `false` | `true`, `false` | Whether to ignore icons that are not found. If `true`, icons that are not found will be ignored. If `false`, an error will be thrown if an icon is not found. |


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
---

The shortcode defined in the `icon.shortcode` option is used to insert icons into the page. It takes a single argument, the icon source and the icon name. The source and icon name are separated by the delimiter defined in the `icon.delimiter` option. For example, to insert the `heart` icon from the `custom` source, you would use the shortcode like this:

```twig
{% icon "custom:heart" %}
```

Alternatively, you can use the `default` option to set a default source. If you set the `default` option to `custom`, you can then use the shortcode like this to insert the `heart` icon:

```twig
{% icon "heart" %}
```

### sprites

| Option | Default | Values | Description |
| --- | --- | --- | --- |
| `shortcode` | `"spriteSheet"` | any | The shortcode name (e.g. `{% spriteSheet %}`) to insert the sprite sheet. It is used to insert the sprite sheet into a page. It takes no arguments. Typically only used when `mode` is set to `sprite`. |
| `class` | `sprite-sheet` | any| The class of the inserted sprites. |
| `insertAttributes` | `{ "class: "sprite-sheet", "style": "display: none;", "aria-hidden": "true", xmlns: 'http://www.w3.org/2000/svg' }` | | The attributes to insert in the sprite sheet. These must be static strings. |
| `insertAll` | `false` | `true`, `false`, `[]` | If set to `true`, all icons from every source will be inserted into the sprite sheet (even if they are not used in the page). If set to `false`, only icons that are used in the page will be inserted. If set to an array, all icons from the specified sources (which must be defined in the `sources` option) will be inserted, even if they are not used in the page. This option is not recommended for use with large icon sets, as it will increase build time and the size of the sprite sheet. |
| `generateFile` | `false` | `string`, `false` | If set to a string, an SVG file will be generated and saved to the specified path in the output directory. If set to `true`, the file will be saved to `sprite.svg` in the output directory. If set to `false`, no file will be generated. |

## Config Examples

Shown are the default values for each option.

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons, {
        mode: 'inline', 
        sources: {}, 
        default: false, 
        optimize: false, 
        SVGO: 'svgo.config.js', 
        icon: {
            shortcode: 'icon', 
            delimiter: ':', 
            class: function (name, source) {
                
                return `icon icon-${name}`;
            },
            id: function (name, source) {
                
                return `icon-${name}`;
            },
            insertAttributes: {}, 
            insertAttributesBySource: {}, 
            overrideExistingAttributes: true, 
            ignoreNotFound: false, 
        },
        sprites: {
            shortcode: 'spriteSheet', 
            insertAttributes: {
                
                class: 'sprite-sheet',
                style: 'display: none;',
                'aria-hidden': 'true',
                xmlns: 'http:
            },
            insertAll: false, 
            generateFile: false, 
        },
    });
}
```

### Using a Custom Naming Pattern

By default, the plugin uses the icon name as the ID and class of the inserted icon. For example, the `heart` icon from any source would have the following class and ID:

```html
class="icon icon-heart"
id="icon-heart"
```

If you want to change this, you can use the `icon.id` and `icon.class` options. For example, the following would change the class and ID to include the source name:

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons, {
        // ...
        icon: {
            class: function(name, source) {
                return `icon icon-${source}-${name}`;
            },
            id: function(name, source) {
                return `icon-${source}-${name}`;
            }
        },
    });
}
```

This would lead to the following class and ID for the `heart` icon from the `custom` source, for example:

```html
class="icon icon-custom-heart"
id="icon-custom-heart"
```

## Credits

- [eleventy-plugin-template](https://github.com/5t3ph/eleventy-plugin-template) by [Stephanie Eckles](https://5t3ph.dev/)
