/*
  Maps a source file to its URL.
  src/pages/en/about.njk            -> /about/
  src/pages/en/what-i-do/index.njk  -> /what-i-do/
  src/pages/ar/about.njk            -> /ar/about/
  English lives at the root; every other language gets a prefix.
*/
function permalinkFor(filePathStem, lang) {
  const rest = filePathStem
    .replace(new RegExp(`^/pages/${lang}`), "")
    .replace(/\/index$/, "");
  const prefix = lang === "en" ? "" : `/${lang}`;
  return `${prefix}${rest}/`.replace(/\/+/g, "/");
}

module.exports = { permalinkFor };
