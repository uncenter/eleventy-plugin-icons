const fs = require("fs");
const path = require("path");

const Chalk = require("chalk");

const SOURCE_DIR = path.join(__dirname, "./lib"); // Path to the icons directory.

module.exports = (eleventyConfig, options) => {
    const validOptions = {
        mode: function (value, options) {
            return ["sprite", "inline"].includes(value); // The mode can be either "sprite" or "inline".
        },
        default: function (value, options) {
            return (typeof value === "string" && options.sources[value] !== undefined) || value === false; // The default source can be "feather", "tabler", "lucide" or false.
        },
        sources: function (value, options) {
            return typeof value === "object";
        },
        insertIcon: function (value, options) {
            return typeof value === "object";
        },
        insertSpriteSheet: function (value, options) {
            return typeof value === "object";
        },
        removeAttributes: function (value, options) {
            return Array.isArray(value);
        }
    }

    const defaults = {
        mode: 'inline',
        sources: { // Defines custom sources. For example, to add a source called "custom" with a path to your custom icons directory, you would do: sources: { custom: "./path/to/icons" }
            feather: path.join(SOURCE_DIR, "feather"),
            tabler: path.join(SOURCE_DIR, "tabler"),
            lucide: path.join(SOURCE_DIR, "lucide"),
        },
        default: false, // The default source for icons without a source (e.g. "activity" instead of "feather:activity"). Can be false, "feather", "tabler", "lucide" or a 
        insertIcon: {
            shortcode: "icon", // The shortcode to insert the icon.
            class: function(name, source) { // The class of the inserted icon (e.g. "icon icon-activity") on either the sprite or the inline icon.
                return `icon icon-${name}`;
            },
            id: function(name, source) { // The ID/link of sprite icons (e.g. "icon-activity").
                return `icon-${name}`;
            }
        },
        insertSpriteSheet: {
            shortcode: "spriteSheet", // The shortcode to insert the sprite sheet.
            class: "sprite-sheet", // Class of the inserted sprite sheet.
            styles: "position: absolute; width: 0; height: 0; overflow: hidden;", // Visually hide the sprite sheet.
        },
        removeAttributes: ['class', 'width', 'height', 'xlmns'], // Attributes to remove from the source SVGs.
    };

    const settings = Object.assign({}, defaults, options);
    Object.entries(settings).forEach(([key, value]) => {
        if (!validOptions[key](value, settings)) {
            throw new Error(`Invalid option for eleventy-plugin-icons: ${key}=${value}`);
        }
    });
    if (settings.mode === 'inline' && !settings.insertSpriteSheet.override) {
        console.warn(Chalk.yellow("The sprite sheet is useless in inline mode. Set the mode to 'sprite' to use the sprite sheet or set `insertSpriteSheet.override` to `true` to hide this warning and insert the sprite sheet anyway."));
    }

    function parseIconSource(string){
        if (typeof settings.default === "string" && !string.includes(":")) { // If the source is set and the string doesn't contain a source.
            return [settings.sources[settings.default], string];
        } else if (settings.default === false && !string.includes(":")) { // If the source is not set and the string doesn't contain a source.
            throw new Error(`No source specified for icon: ${string}`);
        } else if (string.includes(":") && settings.sources[(string.split(":")[0])] === undefined) { // If the string contains a source but the source is invalid.
            throw new Error(`Invalid source specified for icon: ${string}`);
        }
        const [source, name] = string.split(":"); // If the string contains a source (e.g. "feather:activity").
        if (settings.sources[source] !== undefined) { // If the source is valid.
            return [settings.sources[source], name];
        }
    }

    function getIconContent(name, source) {
        const iconPath = path.join(source, `${name}.svg`); // Path to the icon (e.g. "./lib/feather/activity.svg")
        if (fs.existsSync(iconPath)) {
            const content = fs.readFileSync(iconPath, "utf8");
            let attributes = content.match(/<svg ([^>]+)>/)[1]; // Get the attributes of the <svg> tag.
            attributes = attributes.match(/(\w-?)+="[^"]+"/g);
            attributes = attributes.filter((attribute) => {
                const name = attribute.split("=")[0]; // Split the attribute into name and value.
                return !settings.removeAttributes.includes(name); // Remove the attributes that are in the removeAttributes array.
            });
            return [content, attributes];
        }
    }

    const insertIcon = function (string) {
        if (!parseIconSource(string)) { // If the source is invalid.
            return "";
        }
        const icon = parseIconSource(string)[1];
        const source = parseIconSource(string)[0];
        if (this.page.icons === undefined) {
            this.page.icons = [];
        }
        if (!this.page.icons.includes(icon)) {
            this.page.icons.push([icon, source]);
        }

        if (settings.mode === 'inline') { 
            const [content, attributes] = getIconContent(icon, source);
            if ([content, attributes]) {
                return content
                    .replace(
                        /<svg([^>]+)>/,
                        `<svg class="${settings.insertIcon.class(icon, source)}" ${attributes.join(" ")}>`
                    )
                    .replace(/<!--(.*?)-->/g, "");
            }
            return "";
        } else {
            return `<svg class="${settings.insertIcon.class(icon, source)}"><use href="#${settings.insertIcon.id(icon, source)}"></use></svg>`;
        };
    };

    const insertSpriteSheet = function () {
        if (settings.mode === 'inline' && !settings.insertSpriteSheet.override) {
            return "";
        }
        const pageIcons = this.page.icons || [];
        let sprite = `<svg class="${settings.insertSpriteSheet.class}" aria-hidden="true" style="${settings.insertSpriteSheet.class}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n<defs>\n`;
        let symbols = "";

        for (let [icon, source] of pageIcons) {
            const [content, attributes] = getIconContent(icon, source);
            symbols += content
                .replace(
                    /<svg([^>]+)>/,
                    `<symbol id="${settings.insertIcon.id(icon, source)}" ${attributes.join(" ")}>`
                )
                .replace("</svg>", "</symbol>")
                .replace(/<!--(.*?)-->/g, "");
        }
        if (symbols !== "") {
            sprite += symbols + "</defs>\n</svg>\n";
            return sprite;
        }
        return "";
    };

    eleventyConfig.addShortcode(settings.insertIcon.shortcode, insertIcon)
    eleventyConfig.addShortcode(settings.insertSpriteSheet.shortcode, insertSpriteSheet)
};
