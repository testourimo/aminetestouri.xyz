const { permalinkFor } = require("../../../lib/permalink");

module.exports = {
  lang: "en",
  dir: "ltr",
  layout: "layouts/base.njk",
  permalink: (data) => permalinkFor(data.page.filePathStem, "en"),
};
