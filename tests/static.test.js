/* Static checks on the source and on the built site. Run after `npm run build`: npm test */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ROOT, SITE, vercel, walk } = require("./helpers");

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const pages = () => walk(SITE, ".html");
const csp = () => (vercel.headers[0].headers.find((h) => h.key === "Content-Security-Policy") || {}).value || "";

test("the site is built", () => assert.ok(fs.existsSync(path.join(SITE, "index.html")), "run npm run build first"));

test("every string in src/_data has English and Arabic", () => {
  const missing = [];
  (function visit(v, where) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if ("en" in v || "ar" in v) {
        if (!String(v.en || "").trim() || !String(v.ar || "").trim()) missing.push(where);
        return;
      }
      for (const k of Object.keys(v)) visit(v[k], where + "." + k);
    } else if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${where}[${i}]`));
  })(Object.fromEntries(fs.readdirSync(path.join(ROOT, "src/_data")).filter((f) => f.endsWith(".json")).map((f) => [f, JSON.parse(read("src/_data/" + f))])), "data");
  assert.deepStrictEqual(missing, [], "missing en or ar: " + missing.join(", "));
});

test("Easter Egg Mode: every page knows both modes", () => {
  const nav = JSON.parse(read("src/_data/nav.json"));
  for (const file of pages()) {
    const html = fs.readFileSync(file, "utf8");
    if (!html.includes("<header class=\"site-header\"")) continue; // redirects, 404 shell
    const rel = path.relative(SITE, file);
    assert.match(html, /<html[^>]*data-mode="normal"/, rel + ": data-mode on <html>");
    assert.ok(html.includes("data-egg-nav") && html.includes("data-egg-menu"), rel + ": cube button and menu in the header");
    const menu = html.split("data-egg-menu")[1].split("</nav>")[0];
    assert.strictEqual((menu.match(/<li /g) || []).length, nav.length, rel + ": Egg menu has the same items as nav.json");
    assert.ok(html.includes("sessionStorage.getItem(\"mode\")"), rel + ": mode restore script");
  }
  const home = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  assert.ok(home.includes("data-egg-field") && home.includes("data-egg-hero"), "Home has the cube field");
  assert.ok(home.includes("promo-burst"), "Home has the marketing burst");
});

test("Easter Egg Mode: tokens exist in light and dark, and no hard-coded colours in egg files", () => {
  const tokens = read("src/assets/css/tokens.css");
  const count = (t) => (tokens.match(new RegExp(t + ":", "g")) || []).length;
  // Differ by theme: light, data-theme="dark" and system dark must all set them.
  for (const t of ["--egg-k0", "--egg-k1", "--egg-k2", "--egg-edge", "--egg-edge-blue", "--egg-glow", "--burst-top", "--burst-left", "--burst-right", "--burst-line"]) {
    assert.ok(count(t) >= 3, t + " must be defined for light, dark and system dark");
  }
  // Same in both themes: one definition is enough.
  for (const t of ["--egg-b0", "--egg-b1", "--egg-b2", "--egg-shell", "--egg-shell-top", "--egg-aura-from", "--egg-aura-mid", "--egg-aura-to", "--burst-blue-top"]) {
    assert.ok(count(t) >= 1, t + " is not defined");
  }
  for (const f of ["src/assets/css/egg.css", "src/assets/js/egg.js"]) {
    const code = read(f).replace(/\/\*[\s\S]*?\*\//g, "");
    assert.deepStrictEqual(code.match(/#[0-9a-fA-F]{3,8}\b/g) || [], [], f + " uses a hex colour; use a token");
  }
});

test("Arabic pages mirror: html is rtl and uses the Arabic strings", () => {
  const ar = fs.readFileSync(path.join(SITE, "ar/index.html"), "utf8");
  assert.match(ar, /<html[^>]*lang="ar"[^>]*dir="rtl"/);
  assert.ok(ar.includes("العودة إلى القائمة المعتادة"), "Egg exit string in Arabic");
});

test("security headers are set for every route", () => {
  const h = Object.fromEntries(vercel.headers[0].headers.map((x) => [x.key, x.value]));
  assert.strictEqual(vercel.headers[0].source, "/(.*)");
  for (const k of ["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security"]) assert.ok(h[k], k + " missing");
  assert.match(h["Content-Security-Policy"], /default-src 'self'/);
  assert.match(h["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(h["Content-Security-Policy"], /object-src 'none'/);
  assert.ok(!/script-src[^;]*unsafe-inline/.test(h["Content-Security-Policy"]), "scripts must not allow unsafe-inline");
  assert.ok(!/script-src[^;]*unsafe-eval/.test(h["Content-Security-Policy"]), "scripts must not allow unsafe-eval");
});

test("every inline script is allowed by its hash in the CSP", () => {
  const allowed = new Set((csp().match(/'sha256-[^']+'/g) || []).map((s) => s.slice(1, -1)));
  const seen = new Set();
  for (const file of pages()) {
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      const hash = "sha256-" + crypto.createHash("sha256").update(m[1]).digest("base64");
      seen.add(hash);
      assert.ok(allowed.has(hash), `${path.relative(SITE, file)}: inline script not in the CSP (${hash}). Update script-src in vercel.json.`);
    }
  }
  for (const h of allowed) assert.ok(seen.has(h), "CSP hash no longer matches any inline script: " + h);
});

test("only the allowed outside hosts are used", () => {
  const allowed = ["www.aminetestouri.xyz", "fonts.googleapis.com", "fonts.gstatic.com", "api.fontshare.com", "cdn.fontshare.com", "formspree.io", "www.w3.org", "www.googletagmanager.com", "www.clarity.ms", "schema.org"];
  const bad = new Set();
  for (const file of [...walk(SITE, ".html"), ...walk(SITE, ".css"), ...walk(SITE, ".js")]) {
    for (const m of fs.readFileSync(file, "utf8").matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)) if (!allowed.includes(m[1])) bad.add(m[1] + " in " + path.relative(SITE, file));
  }
  assert.deepStrictEqual([...bad], []);
});

test("no dangerous sinks in the scripts", () => {
  for (const f of walk(path.join(ROOT, "src/assets/js"), ".js")) {
    const code = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(!/\beval\(|new Function\(|document\.write\(|insertAdjacentHTML|outerHTML\s*=/.test(code), path.basename(f) + " uses eval, document.write or raw HTML insertion");
    const inner = code.match(/innerHTML\s*=\s*([^;]+);/g) || [];
    for (const i of inner) assert.match(i, /=\s*(""|'')\s*;/, path.basename(f) + ": innerHTML may only be cleared");
  }
});

test("the contact form posts to the configured endpoint over https", () => {
  const site = JSON.parse(read("src/_data/site.json"));
  assert.match(site.formEndpoint, /^https:\/\/formspree\.io\/f\/\w+$/);
  assert.ok(csp().includes(new URL(site.formEndpoint).origin), "CSP connect-src and form-action must allow the form host");
});

test("no secrets in the repo", () => {
  const patterns = [/AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /ghp_[A-Za-z0-9]{30,}/, /sk-[A-Za-z0-9]{32,}/, /xox[bp]-[A-Za-z0-9-]{10,}/];
  for (const f of [...walk(path.join(ROOT, "src")), ...walk(path.join(ROOT, "lib")), path.join(ROOT, "vercel.json")]) {
    if (/\.(png|jpe?g|webp|woff2?)$/.test(f)) continue;
    const t = fs.readFileSync(f, "utf8");
    for (const p of patterns) assert.ok(!p.test(t), "possible secret in " + path.relative(ROOT, f));
  }
});
