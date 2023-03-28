const fs = require("fs");
const path = require("path");

const Chalk = require("chalk");

module.exports = (eleventyConfig, options) => {
    const validOptions = {
        mode: function (value, options) {
            return ["sprite", "inline"].includes(value); // The mode can be either "sprite" or "inline".
        },
        default: function (value, options) {
            return (typeof value === "string" && options.sources[value] !== undefined) || value === false; // The default source can be "tabler", "lucide", "feather", a custom source or false.
        },
        sources: function (value, options) {
            return typeof value === "object";
        },
        enable: function (value, options) {
            return Array.isArray(value);
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
            tabler: "node_modules/@tabler/icons/icons",
            lucide: "node_modules/lucide-static/icons",
            feather: "node_modules/feather-icons/dist/icons",
        },
        enable: [], // The sources to enable. Can be "tabler", "lucide", "feather" or a custom source.
        default: false, // The default source for icons without a source (e.g. "activity" instead of "feather:activity"). Can be false, "feather", "tabler", "lucide" or a 
        insertIcon: {
            shortcode: "icon", // The shortcode to insert the icon.
            class: function(name, source) { // The class of the inserted icon (e.g. "icon icon-activity") on either the sprite or the inline icon.
                return `icon icon-${name}`;
            },
            id: function(name, source) { // The ID/link of sprite icons (e.g. "icon-activity").
                return `icon-${name}`;
            },
            override: false, // Whether to continue even if the icon is not found.
        },
        insertSpriteSheet: {
            shortcode: "spriteSheet", // The shortcode to insert the sprite sheet.
            class: "sprite-sheet", // Class of the inserted sprite sheet.
            styles: "position: absolute; width: 0; height: 0; overflow: hidden;", // Visually hide the sprite sheet.
            override: false, // Whether to insert the sprite sheet even in inline mode.
        },
        removeAttributes: ['class', 'width', 'height', 'xlmns'], // Attributes to remove from the source SVGs.
    };

    const settings = Object.assign({}, defaults, options);
    const defaultSources = Object.keys(defaults.sources);
    if (settings.enable.length > 0) {
        Object.keys(settings.sources).forEach((key) => {
            if (!settings.enable.includes(key)) {
                delete settings.sources[key];
            }
        });
    } else {
        console.error(Chalk.red("No sources enabled for eleventy-plugin-icons. Please add at least one source to the enable array."));
        process.exit(1);
    }

    for (const [key, value] of Object.entries(settings.sources)) {
        if (!fs.existsSync(value)) {
            if (key in defaults.sources) {
                console.error(Chalk.red(`Could not find the source directory for eleventy-plugin-icons: ${key}=${value}. Did you forget to install the package?`));
                process.exit(1);
            }
            console.error(Chalk.red(`Could not find the source directory for eleventy-plugin-icons: ${key}=${value}.`));
            process.exit(1);
        }
    }
    
    Object.entries(settings).forEach(([key, value]) => {
        if (!validOptions[key](value, settings)) {
            throw new Error(`Invalid option for eleventy-plugin-icons: ${key}=${value}`);
        }
    });

    function parseIconSource(string, page){
        if (typeof settings.default === "string" && !string.includes(":")) { // If the source is set and the string doesn't contain a source.
            return [settings.sources[settings.default], string];
        } else if (settings.default === false && !string.includes(":")) { // If the source is not set and the string doesn't contain a source.
            throw new Error(`No source specified for icon: ${string} (page: ${page.inputPath}).`);
        } else if (string.includes(":") && settings.sources[(string.split(":")[0])] === undefined) { // If the string contains a source but the source is invalid.
            if (settings.sources[string.split(":")[0]] === undefined && defaultSources.includes(string.split(":")[0])) {
                console.error(Chalk.red(`Source is not enabled: ${string.split(":")[0]}`));
                process.exit(1);
            } else {
                console.error(Chalk.red(`Invalid source specified: "${string}" (page: ${page.inputPath}). Did you forget to define the source in the sources option?`));
                process.exit(1);
            }
        }
        const [source, name] = string.split(":"); // If the string contains a source (e.g. "feather:activity").
        if (settings.sources[source] !== undefined) { // If the source is valid.
            return [settings.sources[source], name];
        }
    }

    function getIconContent(name, source, page) {
        const iconPath = path.join(source, `${name}.svg`); // Path to the icon (e.g. "./lib/feather/activity.svg")
        if (fs.existsSync(iconPath)) {
            const content = fs.readFileSync(iconPath, "utf8");
            let attributes = content.match(/<svg ([^>]+)>/)[1]; // Get the attributes of the <svg> tag.
            attributes = attributes.match(/(\w-?)+="[^"]+"/g);
            attributes = attributes.filter((attribute) => {
                const name = attribute.split("=")[0]; // Split the attribute into name and value.
                return !settings.removeAttributes.includes(name); // Remove the attributes that are in the removeAttributes array.
            });
            return { content, attributes };
        } else {
            if (settings.insertIcon.override) {
                console.warn(Chalk.yellow(`Could not find icon: "${name}" in source: "${Object.keys(settings.sources).find(key => settings.sources[key] === source)}" ("${source}") (page: ${page.inputPath}).`));
                return false;
            } else {
                console.error(Chalk.red(`Could not find icon: "${name}" in source: "${Object.keys(settings.sources).find(key => settings.sources[key] === source)}" ("${source}") (page: ${page.inputPath}). Check the documentation of the source for a list of available icons.`));
                process.exit(1);
            }
        }
    }

    const insertIcon = function (string) {
        const page = this.page;
        if (!parseIconSource(string, page)) { // If the source is invalid.
            return "";
        }
        const [source, icon] = parseIconSource(string, page);
        if (this.page.icons === undefined) {
            this.page.icons = [];
        }
        if (!this.page.icons.includes(icon)) {
            this.page.icons.push([icon, source]);
        }

        if (settings.mode === 'inline') { 
            const result = getIconContent(icon, source, page);
            if (result) {
                return result.content
                    .replace(
                        /<svg([^>]+)>/,
                        `<svg class="${settings.insertIcon.class(icon, source)}" ${result.attributes.join(" ")}>`
                    )
                    .replace(/<!--(.*?)-->/g, "");
            }
            return "";
        } else {
            return `<svg class="${settings.insertIcon.class(icon, source)}"><use href="#${settings.insertIcon.id(icon, source)}"></use></svg>`;
        };
    };

    let warnedSpriteSheet = false;
    const insertSpriteSheet = function () {
        const page = this.page;
        if (settings.mode === 'inline' && !settings.insertSpriteSheet.override && !warnedSpriteSheet) {
            console.warn(Chalk.yellow(`\nIt looks like you are using the {% ${settings.insertSpriteSheet.shortcode} %} shortcode in 'inline' mode. Set the mode to 'sprite' to use the sprite sheet or set ${Chalk.magenta('insertSpriteSheet.override')} to ${Chalk.blue('true')} to hide this warning and insert the sprite sheet anyway.\n`));
            warnedSpriteSheet = true;
        }
        if (settings.mode === 'inline' && !settings.insertSpriteSheet.override) {
            return "";
        }
        const pageIcons = this.page.icons || [];
        let sprite = `<svg class="${settings.insertSpriteSheet.class}" aria-hidden="true" style="${settings.insertSpriteSheet.class}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n<defs>\n`;
        let symbols = "";

        for (let [icon, source] of pageIcons) {
            const [content, attributes] = getIconContent(icon, source, page);
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
