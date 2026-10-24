/* Shared by the checks: the built site, vercel.json, and a static server that applies vercel.json headers. */
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));

function walk(dir, ext, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, ext, out);
    else if (!ext || f.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };

/* Serves _site on a free port with the headers from vercel.json, so a CSP mistake shows up here and not in production. */
function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(SITE, url);
    if (url.endsWith("/")) file = path.join(file, "index.html");
    else if (!path.extname(file)) file = path.join(file, "index.html");
    if (!file.startsWith(SITE) || !fs.existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
    const headers = { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" };
    for (const rule of vercel.headers || []) {
      if (new RegExp("^" + rule.source + "$").test(url)) for (const h of rule.headers) headers[h.key] = h.value;
    }
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })));
}

module.exports = { ROOT, SITE, vercel, walk, serve };
