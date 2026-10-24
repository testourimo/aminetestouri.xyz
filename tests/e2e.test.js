/* Browser checks: the 16 variants (viewport x theme x language x mode), Easter Egg Mode behaviour,
   and CSP violations. Serves _site with the headers from vercel.json. Run: npm run test:e2e */
const test = require("node:test");
const assert = require("node:assert");
const { chromium } = require("playwright");
const { serve } = require("./helpers");

let server, base, browser;
test.before(async () => { ({ server, base } = await serve()); browser = await chromium.launch(); });
test.after(async () => { await browser.close(); server.close(); });

const VIEWPORTS = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 780, hasTouch: true, isMobile: true } };

async function open(opts) {
  const ctx = await browser.newContext({ viewport: { width: opts.vp.width, height: opts.vp.height }, hasTouch: !!opts.vp.hasTouch, isMobile: !!opts.vp.isMobile, colorScheme: opts.scheme, reducedMotion: opts.reduce ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push("page error: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && /Content Security Policy|Refused to/.test(m.text())) problems.push("CSP: " + m.text()); });
  return { ctx, page, problems };
}

const cubePoint = (page) => page.evaluate(() => {
  const e = document.querySelector(".egg-cube.is-coral");
  const f = e.querySelector(".fr").getBoundingClientRect(), t = e.querySelector(".t").getBoundingClientRect();
  return { x: (f.x + f.width / 2 + t.x + t.width / 2) / 2, y: (f.y + f.height / 2 + t.y + t.height / 2) / 2 };
});
const mode = (page) => page.evaluate(() => document.documentElement.getAttribute("data-mode"));
const visible = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0; }, sel);

for (const lang of ["en", "ar"]) for (const scheme of ["light", "dark"]) for (const vpName of ["desktop", "mobile"]) {
  test(`${lang} / ${scheme} / ${vpName}: Normal, then Egg, then back`, async () => {
    const { ctx, page, problems } = await open({ vp: VIEWPORTS[vpName], scheme });
    const home = base + (lang === "ar" ? "/ar/" : "/");
    await page.goto(home);
    await page.waitForSelector(".egg-cube.is-coral");

    // Normal: classic nav, cube field, the cube button hidden.
    assert.strictEqual(await mode(page), "normal");
    assert.ok(await page.evaluate(() => document.querySelectorAll(".egg-cube").length) === 56, "56 cubes");
    assert.ok(!(await visible(page, "[data-egg-nav]")), "cube button hidden in Normal");
    assert.ok(vpName === "desktop" ? await visible(page, ".site-nav") : await visible(page, ".site-header__menu-btn"), "classic navigation shown");
    const role = await page.evaluate(() => { const c = document.querySelector(".egg-cube.is-coral"); return [c.getAttribute("role"), c.getAttribute("aria-label"), c.tabIndex]; });
    assert.deepStrictEqual([role[0], !!role[1], role[2]], ["button", true, 0], "coral cube is an accessible button");
    const inView = await page.evaluate(() => { const r = document.querySelector(".egg-cube.is-coral").getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
    assert.ok(inView, "coral cube is on the first screen");

    // Tap the coral cube. Wait for assemble, merge and dock.
    const p = await cubePoint(page);
    if (vpName === "desktop") await page.mouse.click(p.x, p.y); else await page.touchscreen.tap(p.x, p.y);
    await page.waitForFunction(() => document.documentElement.getAttribute("data-mode") === "egg", null, { timeout: 8000 });
    await page.waitForFunction(() => !document.querySelector(".egg-cube"), null, { timeout: 8000 });

    // Egg: the cube is the menu; classic nav hidden; copy visible; tools still there.
    assert.ok(await visible(page, "[data-egg-nav]"), "cube button shown");
    assert.ok(!(await visible(page, ".site-nav")) && !(await visible(page, ".site-header__menu-btn")), "classic navigation hidden");
    assert.ok(await visible(page, ".site-tools__lang") && await visible(page, ".site-tools__theme") || vpName === "mobile", "language and theme tools stay");
    assert.ok(await visible(page, ".hero__heading"), "hero copy back");

    // Menu: opens, lists every page, closes with Escape, focus returns.
    await page.click("[data-egg-nav]");
    await page.waitForFunction(() => document.querySelector("[data-egg-menu]").classList.contains("is-open"));
    assert.strictEqual(await page.getAttribute("[data-egg-nav]", "aria-expanded"), "true");
    assert.strictEqual(await page.evaluate(() => document.querySelectorAll("[data-egg-menu] li a").length), 4);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("[data-egg-menu]").classList.contains("is-open"));
    assert.strictEqual(await page.getAttribute("[data-egg-nav]", "aria-expanded"), "false");

    // Egg lasts across pages in the same tab.
    await page.click("[data-egg-nav]");
    await page.waitForTimeout(500);
    await page.click("[data-egg-menu] li:nth-child(3) a");
    await page.waitForLoadState("load");
    assert.strictEqual(await mode(page), "egg", "Egg persists to the next page");
    assert.ok(await visible(page, "[data-egg-nav]"));

    // A new tab starts in Normal.
    const other = await ctx.newPage();
    await other.goto(home);
    assert.strictEqual(await mode(other), "normal", "a new tab starts in Normal");
    await other.close();

    // Back to the classic menu.
    await page.click("[data-egg-nav]");
    await page.waitForTimeout(500);
    await page.click("[data-egg-exit]");
    assert.strictEqual(await mode(page), "normal");
    assert.ok(!(await visible(page, "[data-egg-nav]")));

    assert.deepStrictEqual(problems, []);
    await ctx.close();
  });
}

test("reduced motion: the assembly snaps and docks quickly", async () => {
  const { ctx, page, problems } = await open({ vp: VIEWPORTS.desktop, scheme: "light", reduce: true });
  await page.goto(base + "/");
  await page.waitForSelector(".egg-cube.is-coral");
  const p = await cubePoint(page);
  await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => document.documentElement.getAttribute("data-mode") === "egg", null, { timeout: 3000 });
  assert.deepStrictEqual(problems, []);
  await ctx.close();
});

test("keyboard: the coral cube assembles with Enter", async () => {
  const { ctx, page } = await open({ vp: VIEWPORTS.desktop, scheme: "dark" });
  await page.goto(base + "/");
  await page.waitForSelector(".egg-cube.is-coral");
  await page.focus(".egg-cube.is-coral");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.documentElement.getAttribute("data-mode") === "egg", null, { timeout: 8000 });
  await ctx.close();
});

test("a visit that never touches the coral cube stays in Normal on every page", async () => {
  const { ctx, page, problems } = await open({ vp: VIEWPORTS.desktop, scheme: "light" });
  for (const path of ["/", "/services/", "/about/", "/contact/", "/ar/", "/ar/about/"]) {
    await page.goto(base + path);
    assert.strictEqual(await mode(page), "normal", path);
    assert.ok(await visible(page, ".site-nav"), path + ": classic nav");
  }
  assert.deepStrictEqual(problems, []);
  await ctx.close();
});

test("the marketing slot animates and has no layout overflow", async () => {
  const { ctx, page, problems } = await open({ vp: VIEWPORTS.mobile, scheme: "dark" });
  await page.goto(base + "/");
  const r = await page.evaluate(() => ({ cubes: document.querySelectorAll(".promo-burst .pb-m").length, core: document.querySelectorAll(".promo-burst .pb-core").length, anim: getComputedStyle(document.querySelector(".pb-m:not(.pb-core)")).animationName, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
  assert.deepStrictEqual(r, { cubes: 27, core: 1, anim: "pb-burst", overflow: false });
  assert.deepStrictEqual(problems, []);
  await ctx.close();
});
