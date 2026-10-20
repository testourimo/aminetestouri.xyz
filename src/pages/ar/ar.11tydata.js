const { permalinkFor } = require("../../../lib/permalink");

module.exports = {
  lang: "ar",
  dir: "rtl",
  layout: "layouts/base.njk",
  permalink: (data) => permalinkFor(data.page.filePathStem, "ar"),
};
