# `eleventy-plugin-icons`

## Usage

Install via npm:

```bash
npm install eleventy-plugin-icons
```

Then, include it in your `.eleventy.js` config file:

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons);
};
```

## Config Options

| Option | Type | Default |
| --- | --- | --- |
| [`mode`](#mode) | `string` | `sprite` |
| [`source`](#source) | `string` or `false` | `false` |
| [`insertIcon`](#inserticon) | `object` | |
| [`insertSpriteSheet`](#insertspritesheet) | `object` | |
| [`removeAttributes`](#removeattributes) | `array` | `['class', 'width', 'height', 'xlmns']` |

### mode

The mode option can be either `sprite` or `inline`. If `sprite` is used, using the `insertIcon` shortcode will insert a `<use>` reference for each icon (used in conjunction with the `insertSpriteSheet` shortcode). If `inline` is used, the `inserIcon` shortcode will insert the SVG code directly into the page (no sprite sheet required).

### insertIcon

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `shortcode` | `string` | `icon` | The shortcode name (e.g. `{% icon %}`) to insert the icon. |
| `class` | `string` or `function` | `icon icon-{name}` | The class of the inserted icon (e.g. `class="icon icon-activity"`) on either the sprite or the inline icon. If a function is used, it will be passed the icon name and source. |
| `id` | `string` or `function` | `icon-{name}` | The ID/link of sprite icons (e.g. `id="icon-activity"`) or the `href` of sprite references (e.g. `href="#icon-activity"`). If a function is used, it will be passed the icon name and source. |

The `insertIcon` shortcode can be used to insert an icon into a page. It takes a single argument, the icon source (e.g. `tabler`) and the icon name (e.g. `activity`).
For example, to insert the `activity` icon from the `tabler` source, you would use the shortcode like this:

```twig
{% icon tabler:activity %}
```

Alternatively, you can use the `source` option to set a default source. If you set the `source` option to `tabler`, you can then use the shortcode like this:

```twig
{% icon activity %}
```

### insertSpriteSheet

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `shortcode` | `string` | `spriteSheet` | The shortcode name (e.g. `{% spriteSheet %}`) to insert the sprite sheet. |
| `class` | `string` | `sprite-sheet` | The class of the inserted sprite sheet. |
| `styles` | `string` | `position: absolute; width: 0; height: 0; overflow: hidden;` | The styles of the inserted sprite sheet. |

The `insertSpriteSheet` shortcode can be used to insert the sprite sheet into a page. It takes no arguments. Only used when `mode` is set to `sprite`.

## Config Examples

Shown are the default values for each option.

```js
const pluginIcons = require("eleventy-plugin-icons");

module.exports = (eleventyConfig) => {
    eleventyConfig.addPlugin(pluginIcons, {
        mode: "sprite",
        source: false,
        insertIcon: {
            shortcode: "icon",
            class: function (name, source) {
                return `icon icon-${name}`;
            },
            id: function (name, source) {
                return `icon-${name}`;
            },
        },
        insertSpriteSheet: {
            shortcode: "spriteSheet",
            class: "sprite-sheet",
            styles: "position: absolute; width: 0; height: 0; overflow: hidden;",
        },
        removeAttributes: ["class", "width", "height", "xlmns"],
    });
}
```


## Credits

- [eleventy-plugin-template](https://github.com/5t3ph/eleventy-plugin-template) by [Stephanie Eckles](https://5t3ph.dev/)

### Sources
- [Tabler Icons](https://tabler-icons.io/) ([GitHub](https://github.com/tabler/tabler-icons))
