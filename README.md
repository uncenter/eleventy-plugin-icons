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
| [`sources`](#sources) | `object` | |
| [`default`](#default) | `string` or `false` | `false` |
| [`insertIcon`](#inserticon) | `object` | |
| [`insertSpriteSheet`](#insertspritesheet) | `object` | |
| [`removeAttributes`](#removeattributes) | `array` | `['class', 'width', 'height', 'xlmns']` |

### mode

The mode option can be either `sprite` or `inline`. If `sprite` is used, using the `insertIcon` shortcode will insert a `<use>` reference for each icon (used in conjunction with the `insertSpriteSheet` shortcode). If `inline` is used, the `inserIcon` shortcode will insert the SVG code directly into the page (no sprite sheet required).

### sources

The sources option is an object of source names and paths. The source name is used in the shortcode (e.g. `feather:activity`), and the path is the location of the SVG files. For example, if you wanted to add a source called `custom` that points to the `icons` directory in the `src` folder of your project, you would use the following:

```js
sources: {
    custom: "./src/icons"
}
```

And then use the shortcode like this:

```twig
{% icon custom:activity %}
```

### default

The default source for icons without a source (e.g. "activity" instead of "feather:activity"). Can be false, "feather", "tabler", "lucide" or a custom path defined in the `sources` option.

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

### removeAttributes

An array of attributes to remove from raw SVGs. This is useful for removing attributes that are not needed (e.g. `width`, `height`, `xmlns`) or that may conflict with other attributes (e.g. `class`). If these are for some reason needed, set the `removeAttributes` option to an empty array (`[]`).

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
