const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/*
  A short hash of every stylesheet and script. It is added to their URLs
  (main.css?v=…), so browsers fetch new files whenever any of them change
  and can safely cache them for a long time otherwise.
*/
const ASSETS = path.join(__dirname, "..", "assets");

function hashOf(dir, ext) {
  const hash = crypto.createHash("sha1");
  for (const file of fs.readdirSync(path.join(ASSETS, dir)).sort()) {
    if (file.endsWith(ext)) hash.update(fs.readFileSync(path.join(ASSETS, dir, file)));
  }
  return hash.digest("hex").slice(0, 10);
}

module.exports = () => ({
  cssVersion: hashOf("css", ".css"),
  jsVersion: hashOf("js", ".js"),
});
