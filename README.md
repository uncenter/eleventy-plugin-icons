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

You can change/set attributes for an icon right in the shortcode:

```twig
{% icon "star", stroke="#ed8a19", class="starry-night" %}
```

> [!WARNING]
> Using keyword arguments as seen above might not be available in all template languages - all examples in this README are using Nunjucks, which [supports kwargs](https://mozilla.github.io/nunjucks/templating.html#keyword-arguments). You can instead provide an attributes object as the second argument like this:
>
> ```twig
> {% icon "star", { "stroke": "#ed8a19", "class": "starry-night" } %}
> ```
>
> or even a JSON string of an object:
>
> ```twig
> {% icon "star", '{ "stroke": "#ed8a19", "class": "starry-night" }' %}
> ```

You can set attributes for all icons:

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

You can add **any directory** as a source for your icons, including icons from NPM packages (in `node_modules`, see [Popular icon sets](#popular-icon-sets)).

## Install

```sh
npm i eleventy-plugin-icons
pnpm add eleventy-plugin-icons
yarn add eleventy-plugin-icons
bun add eleventy-plugin-icons
```

## Usage

To enable this plugin, add the following to your [11ty configuration file](https://www.11ty.dev/docs/config/#default-filenames).

```js
const pluginIcons = require('eleventy-plugin-icons');

module.exports = (eleventyConfig) => {
  eleventyConfig.addPlugin(pluginIcons, {});
};
```

To give you an idea of the level of customization this plugin offers, take a look at the default configuration below. To start configuring right now, skip to [Configuration](#configuration).

> [!NOTE]
> Future examples of options will just be an object, like the default options object below. To edit your options, edit the `{}` object from the line:
>
> ```js
> eleventyConfig.addPlugin(pluginIcons, {});
> ```

```js
{
  mode: 'inline',
  sources: [],
  icon: {
    shortcode: 'icon',
    delimiter: ':',
    transform: async (content) => content,
    class: (name, source) => `icon icon-${name}`,
    id: (name, source) => `icon-${name}`,
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
}
```

### Getting started

To start, you need a source to pull icons from. For example, if you have some custom icons in the `src/icons` directory, you can add those as a source like so:

```js
{
  sources: [{ name: 'custom', path: './src/icons' }];
}
```

Now in your templates you can insert your icons using the `icon` shortcode.

```twig
{% icon "custom:my-icon" %}
```

As you can see, the icon "identifier" or name must be prefixed by the name of the source. However, you can make a source the default source with `default: true`. With a default source, icons can be inserted without an indentifier (`{% icon "my-icon" %}` instead of `{% icon "custom:my-icon" %}`).

```js
{
  sources: [{ name: 'custom', path: './src/icons', default: true }];
}
```

You can add as many sources as you want, but you can only have one default source.

### Popular icon sets

Often you will want to use your favorite icon set; since you can use icons from any folder, we can pull them from the `node_modules` folder. There are no sources defined out of the box, but here are some popular icon sets for reference:

|                                         | Package                                                      | Icons Directory                         |
| --------------------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| [Simple Icons](https://simpleicons.org) | [simple-icons](https://www.npmjs.com/package/simple-icons)   | `node_modules/simple-icons/icons`       |
| [Lucide](https://lucide.dev/)           | [lucide-static](https://www.npmjs.com/package/lucide-static) | `node_modules/lucide-static/icons`      |
| [Tabler](https://tabler-icons.io/)      | [@tabler/icons](https://www.npmjs.com/package/@tabler/icons) | `node_modules/@tabler/icons/icons`      |
| [Feather](https://feathericons.com/)    | [feather-icons](https://www.npmjs.com/package/feather-icons) | `node_modules/feather-icons/dist/icons` |

To use icons from a package, install the package and define the source in `sources`. For example, to use a source named `lucide` that points to the icons in `node_modules/lucide-static/icons`:

```sh
npm i lucide-static
```

```js
{
  sources: [{ name: 'lucide', path: 'node_modules/lucide-static/icons' }],
}
```

## Configuration

### `mode`

- **Type**: `'inline' | 'sprite'`
- **Default**: `'inline'`

The `mode` option specifies how icons are handled. It can take one of two values:

- `'inline'`: When set to `'inline'`, the `icon` shortcode will insert SVGs directly into the page. No "sprite sheet" is required in this mode.
- `'sprite'`: When set to `'sprite'`, the `icon` shortcode will insert `<use>` references for each icon. This mode should be used in conjunction with the `sprite` shortcode, which inserts a sprite of all the icons used on a page; insert your icons normally but make sure you use the `sprite` shortcode on each page, like in a template. Alternatively, you can use the `sprite.writeFile` option to write the sprite to the output directory and include that file in each page instead.

> [!IMPORTANT]
> Adding attributes on a per-icon basis that affect the appearance of the icon (e.g. `fill` or `stroke`) in `sprite` mode will not function correctly due to the limitations of SVG sprites.

### `sources`

- **Type**: `Array<{ name: string, path: string, default?: boolean }>`
- **Default**: `[]`

The `sources` option is an array of source objects, each of which has the following properties:

- `name` (string): A unique name for the source used in the shortcode (e.g., the word `custom` in `custom:my-icon`).
- `path` (string): The directory path where the SVGs for this source are located.
- `default` (boolean, optional): If set to `true`, this source becomes the default source.
- `getFileName` (function, optional): Provide a function that takes in the icon name as the first arugment and returns a path to an SVG file. Defaults to `(iconName) => iconName + '.svg'`.

You can add multiple sources to categorize and organize your icons.

```javascript
{ name: 'custom', path: './src/icons', default: true }
```

> [!NOTE]
> You can refer to [Getting started](#getting-started) for more information on adding sources.

### `icon`

This section outlines various options related to the `icon` shortcode.

#### `shortcode`

- **Type**: `string`
- **Default**: `'icon'`

The `shortcode` option specifies the name of the shortcode used to insert icons. For example, if you set `shortcode` to `'insertIcon'`, you would use `{% insertIcon %}` to insert an icon.

#### `delimiter`

- **Type**: `string`
- **Default**: `':'`

The `delimiter` option defines the character used to separate the source and icon name in the shortcode. For example, if the delimiter is set to `'@'`, you would use `custom@my-icon` to reference an icon from the `custom` source.

#### `transform`

- **Type**: `async function (content: string) => string`
- **Default**: `async (content) => content`

The `transform` option is an asynchronous function that allows you to modify the raw content of an SVG before attribute manipulation. By default, it simply returns the original content. You can customize this function to perform transformations as needed.

For example, you could optimize each icon with SVGO:

```js
const { optimize, loadConfig } = require('svgo');

const pluginIcons = require('eleventy-plugin-icons');

module.exports = (eleventyConfig) => {
  eleventyConfig.addPlugin(pluginIcons, {
    // ...
    icon: {
      transform: async (svg) => {
        try {
          const config = await loadConfig('./svgo.config.js');
          try {
            const result = optimize(svg, config);
            return result.data;
          } catch (error) {
            throw new Error('Error optimizing content with SVGO.');
          }
        } catch (error) {
          throw new Error('Error loading SVGO config file.');
        }
    }
  });
};
```

#### `class`

- **Type**: `function (name: string, source: string) => string`
- **Default**: `(name, source) => 'icon icon-'+ name`

The `class` option adds a dynamically generated class to the class attribute of the inserted icon. The function takes the icon name and source as arguments and should return a string. By default, it generates a class like `icon icon-my-icon`.

#### `id`

- **Type**: `function (name: string, source: string) => string`
- **Default**: `(name, source) => 'icon-' + name`

The `id` option defines the dynamic `id` attribute for sprite icons and the `href` attribute for sprite references. This function takes the icon name and source as arguments and should return a string. By default, it generates an ID like `icon-my-icon`.

#### `attributes`

- **Type**: `Record<string, string>`
- **Default**: `{}`

The `attributes` option allows you to set additional (static) attributes for the icon. It takes an object where keys represent attribute names, and values represent attribute values. For example, `{ 'aria-hidden': 'true' }` sets `aria-hidden="true"`.

#### `attributesBySource`

- **Type**: `Record<string, Record<string, string>>`
- **Default**: `{}`

The `attributesBySource` option allows you to set icon attributes based on their source. It takes an object where each key represents a source name, and the corresponding value is another object specifying attribute-value pairs. For example, `{ custom: { 'aria-hidden': 'true' } }` sets `aria-hidden="true"` if the source is `custom`.

#### `overwriteExistingAttributes`

- **Type**: `boolean`
- **Default**: `true`

The `overwriteExistingAttributes` option determines whether existing attributes on the original SVG should be overwritten. When set to `true`, existing attributes will be replaced with the new attributes. If set to `false`, existing attributes will be merged with new ones.

#### `errorNotFound`

- **Type**: `boolean`
- **Default**: `true`

The `errorNotFound` option controls error handling for icons that are not found. When set to `true`, an error will be thrown for missing icons. If set to `false`, only a warning will be displayed.

### `sprite`

This section outlines options related to the `sprite` shortcode.

#### `shortcode`

- **Type**: `string`
- **Default**: `'spriteSheet'`

The `shortcode` option specifies the name of the shortcode used to insert the sprite sheet. For example, if you set `shortcode` to `'insertSprite'`, you would use `{% insertSprite %}` to insert the sprite sheet. This shortcode takes no arguments and is used when `mode` is set to `'sprite'`.

#### `class`

- **Type**: `string`
- **Default**: `'sprite-sheet'`

The `class` option defines the class attribute of the inserted sprite SVG.

#### `attributes`

- **Type**: `Record<string, string>`
- **Default**: `{ "class: "sprite-sheet", "aria-hidden": "true", xmlns: 'http://www.w3.org/2000/svg' }`

The `attributes` option allows you to set additional attributes for the sprite SVG. It takes an object where keys represent attribute names, and values represent attribute values.

#### `extraIcons`

- **Type**: `{ all: boolean, sources: string[], icons: Array<{ name: string, source: string }> }`
- **Default**: `{ all: false, sources: [], icons: [] }`

The `extraIcons` option lets you add additional icons to the sprite sheet, even if they are not directly used in your content. It has the following properties:

- `all` (boolean): If set to `true`, all icons from every source will be inserted into the sprite sheet, regardless of whether they are used on the page.
- `sources` (string[]): If `sources` is specified, all icons from the sources listed in this array will be inserted into the sprite sheet, even if they are not used on the page.
- `icons` (Object[]): You can provide an array of icon objects, where each object has a `name` and a `source`. These icons will be included in the sprite sheet.

#### `writeFile`

- **Type**: `string | false`
- **Default**: `false`

The `writeFile` option controls whether the generated sprite SVG is written to a specified path in the 11ty output directory. If you want to write the sprite SVG to a file, provide a string representing the file path. To disable writing the file, set `writeFile` to `false`.

## License

[MIT](LICENSE)
