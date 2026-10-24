const { icon, isoPattern, isoCols, isoScene, processIcon, promoBurst, figure } = require("./lib/shortcodes");
const nav = require("./src/_data/nav.json");

module.exports = function (eleventyConfig) {
  // Static files are copied as they are.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/icons/favicon.svg": "favicon.svg" });

  // Re-run the build when CSS, JS or images change.
  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addShortcode("icon", icon);
  eleventyConfig.addShortcode("iso", isoPattern);
  eleventyConfig.addShortcode("figure", figure);
  eleventyConfig.addShortcode("isoCols", isoCols);
  eleventyConfig.addShortcode("isoScene", isoScene);
  eleventyConfig.addShortcode("processIcon", processIcon);
  eleventyConfig.addShortcode("promoBurst", promoBurst);

  // Picks the string for the page language from a { en, ar } object.
  eleventyConfig.addFilter("t", (value, lang) => {
    if (value && typeof value === "object") return value[lang] ?? value.en;
    return value;
  });

  eleventyConfig.addFilter("pad", (n) => String(n).padStart(2, "0"));

  // URL of a page (by its nav key) in a given language. Used by the language switch.
  eleventyConfig.addFilter("urlFor", (key, lang) => {
    const items = nav.flatMap((item) => [item, ...(item.children || [])]);
    const match = items.find((item) => item.key === key);
    return match ? match.url[lang] : lang === "en" ? "/" : `/${lang}/`;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
