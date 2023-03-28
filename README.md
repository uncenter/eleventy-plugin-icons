# `eleventy-plugin-icons`

## Usage

Install via npm:

```sh
npm install eleventy-plugin-icons
```

You will also need to install the package for each source you want to use. See the [Sources](#sources) section for more info.

Then, include it in your `.eleventy.js` config file:

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons);
};
```

### Sources

The following sources are configured by default. To use each, install the package and then use the source name in the shortcode (e.g. `tabler:activity`). If you want to use a different source, see the [Config Options](#config-options) section.

Make sure to install the correct package for each source as listed below.

| Source | Package | Shortcode |
| --- | --- | --- |
| [Tabler](https://tabler-icons.io/) | [@tabler/icons](https://www.npmjs.com/package/@tabler/icons) | `tabler:activity` |
| [Lucide](https://lucide.dev/) | [lucide-static](https://www.npmjs.com/package/lucide-static) | `lucide:activity` |
| [Feather](https://feathericons.com/) | [feather-icons](https://www.npmjs.com/package/feather-icons) | `feather:activity` |

> **Note**
> Feather Icons hasn't been updated in a while, so it's recommended to use the popular and consistently updated fork [Lucide](https://lucide.dev/) instead (also included by default).

## Config Options

| Option | Type | Default | Required |
| --- | --- | --- | --- |
| [`mode`](#mode) | `string` | `sprite` | |
| [`sources`](#sources) | `object` | | |
| [`enable`](#enable) | `array` | `[]` | * |
| [`default`](#default) | `string` or `false` | `false` | |
| [`insertIcon`](#inserticon) | `object` | | |
| [`insertSpriteSheet`](#insertspritesheet) | `object` | | |
| [`removeAttributes`](#removeattributes) | `array` | `['class', 'width', 'height', 'xlmns']` | |

### mode

The mode option can be either `sprite` or `inline`. If `sprite` is used, using the `insertIcon` shortcode will insert a `<use>` reference for each icon (used in conjunction with the `insertSpriteSheet` shortcode). If `inline` is used, the `insertIcon` shortcode will insert the SVG code directly into the page (no sprite sheet required).

### sources

The sources option is an object of source names and paths. The source name is used in the shortcode (e.g. `tabler:activity`), and the path is the location of the SVG files. For example, if you wanted to add a source called `custom` that points to the `icons` directory in the `src` folder of your project, you would use the following:

```js
sources: {
    custom: "./src/icons"
}
```

And then use the shortcode like this:

```twig
{% icon "custom:activity" %}
```

### enable

The enable option is an array of source names to enable. **None are enabled by default, so this is required for the plugin to be functional.** For example, if you wanted to enable the `tabler` and `lucide` sources, you would use the following:

```js
enable: ["tabler", "lucide"]
```

### default

The default source for icons without a specified source (e.g. "activity" instead of "tabler:activity"). Can be `false`, "tabler", "lucide", "feather", or the name of a custom source. If `false`, no default source will be used (an error will be thrown if no source is specified).

### insertIcon

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `shortcode` | `string` | `icon` | The shortcode name (e.g. `{% icon %}`) to insert the icon. |
| `delimiter` | `string` | `:` | The delimiter between the source and icon name (e.g. `tabler:activity`). Must be one of `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `+`, `=`, `|`, `:`, `;`, `<`, `>`, `.`, `?`, `/`, or `~`. |
| `class` | `string` or `function` | `icon icon-<name>` | The class of the inserted icon (e.g. `class="icon icon-activity"`) on either the sprite or the inline icon. If a function is used, it will be passed the icon name and source. |
| `id` | `string` or `function` | `icon-<name>` | The ID/link of sprite icons (e.g. `id="icon-activity"`) or the `href` of sprite references (e.g. `href="#icon-activity"`). If a function is used, it will be passed the icon name and source. |
| override | `boolean` | `false` | Whether to continue even if an icon is not found (typically used for debugging). |

The `insertIcon` shortcode can be used to insert an icon into a page. It takes a single argument, the icon source (e.g. `tabler`) and the icon name (e.g. `activity`).
For example, to insert the `activity` icon from the `tabler` source, you would use the shortcode like this:

```twig
{% icon "tabler:activity" %}
```

Alternatively, you can use the `default` option to set a default source. If you set the `default` option to `tabler`, you can then use the shortcode like this to insert the `activity` icon from the `tabler` source:

```twig
{% icon "activity" %}
```

### insertSpriteSheet

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `shortcode` | `string` | `spriteSheet` | The shortcode name (e.g. `{% spriteSheet %}`) to insert the sprite sheet. |
| `class` | `string` | `sprite-sheet` | The class of the inserted sprite sheet. |
| `styles` | `string` | `position: absolute; width: 0; height: 0; overflow: hidden;` | The styles of the inserted sprite sheet. |
| `override` | `boolean` | `false` | Whether to insert the sprites even in `inline` mode (not sure why you would want to do this, but it's there). |

The `insertSpriteSheet` shortcode is be used to insert the sprite sheet into a page. It takes no arguments. Only used when `mode` is set to `sprite`.

### removeAttributes

An array of attributes to remove from raw SVGs. This is used to removing attributes that are typically not needed (e.g. `width`, `height`, `xmlns`) or that may conflict with other attributes (e.g. `class`). If these are for some reason needed, set the `removeAttributes` option to an empty array (`[]`).

## Config Examples

Shown are the default values for each option.

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons, {
        mode: 'inline',
        sources: {
            tabler: "node_modules/@tabler/icons/icons",
            lucide: "node_modules/lucide-static/icons",
            feather: "node_modules/feather-icons/dist/icons",
        },
        enable: [],
        default: false,
        insertIcon: {
            shortcode: "icon",
            delimiter: ":",
            class: function(name, source) {
                return `icon icon-${name}`;
            },
            id: function(name, source) {
                return `icon-${name}`;
            }
        },
        insertSpriteSheet: {
            shortcode: "spriteSheet",
            class: "sprite-sheet",
            styles: "position: absolute; width: 0; height: 0; overflow: hidden;",
        },
        removeAttributes: ['class', 'width', 'height', 'xlmns'], 
    });
}
```

### Using a Custom Source

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons, {
        sources: {
            custom: "./src/icons"
        },
        enable: ["custom"],
    });
}
```

This example adds a custom source called `custom` that points to the `icons` directory in the `src` folder of your project. You can then use the shortcode like this:

```twig
{% icon "custom:activity" %}
```

### Using a Custom Naming Pattern

By default, the plugin uses the icon name as the ID and class of the inserted icon. For example, the `activity` icon from any source would have the following class and ID:

```html
class="icon icon-activity"
id="icon-activity"
```

If you want to change this, you can use the `insertIcon` option to change the class and ID of the inserted icon. For example, the following would change the class and ID to include the source name:

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons, {
        enable: ["<source>"],
        insertIcon: {
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

This would lead to the following class and ID for the `activity` icon from the `tabler` source, for example:

```html
class="icon icon-tabler-activity"
id="icon-tabler-activity"
```

## Credits

- [eleventy-plugin-template](https://github.com/5t3ph/eleventy-plugin-template) by [Stephanie Eckles](https://5t3ph.dev/)
