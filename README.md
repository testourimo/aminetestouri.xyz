# aminetestouri.xyz

Personal portfolio of Mo.Amine Testouri, product designer.
Built with [Eleventy](https://www.11ty.dev/) on the Amine Testouri design system. English at `/`, Arabic (RTL) at `/ar/`.

## Run it

```bash
npm install
npm run dev     # local server with live reload at http://localhost:8080
npm run build   # static site in _site/
npm run check   # build, then all tests (see "Checks and security")
```

## Sitemap

| Page | English | Arabic | Holds |
|---|---|---|---|
| Home | `/` | `/ar/` | Hero, selected work (scroller), services teaser, Process of work snippet (`#process`) |
| Services | `/services/` | `/ar/services/` | Services |
| About me | `/about/` | `/ar/about/` | Intro and portrait, Experience (`#experience`), then Process of work in detail (`#process`) |
| Contact | `/contact/` | `/ar/contact/` | Contact form |

The marketing slot after Process of work (`src/_includes/partials/promo.njk`, copy in `src/_data/marketing.json`, `"enabled": false` removes it) is full width on the inverted ground and shows `{% promoBurst %}`: a 3 × 3 × 3 block of cubes that opens to reveal the coral cube inside, then closes (10 s loop, still when reduced motion is on). It follows the theme and mirrors in Arabic; its colours are the `--burst-*` tokens.

Old addresses (`/what-i-do/`, `/what-i-do/process/`, `/experience/`) redirect in `vercel.json`. Process of work lives in `src/_data/process.json` (five stages, shared by Home and About); Home shows the five process icons from the `{% processIcon n %}` shortcode (isometric tile icons, one per stage, with a hover loop); About keeps the scroll scenes from `{% isoScene %}`.

## Folder structure

```
.
├── eleventy.config.js        Build config: passthrough, shortcodes, filters
├── vercel.json               Hosting: build command, output folder, cache headers
├── lib/
│   ├── permalink.js          File path → URL (English at root, /ar/ for Arabic)
│   └── shortcodes.js         {% icon %}, {% iso %} pattern, {% figure %} image slots, {% processIcon %}, {% promoBurst %}
└── src/
    ├── _data/                Content shared across pages, in both languages
    │   ├── site.json         Name, role, description, signature
    │   ├── nav.json          Sitemap and menu labels
    │   ├── ui.json           Small interface strings
    │   ├── services.json     Services (tags, anchors, copy)
    │   ├── process.json      How I work, five steps (on the Services page)
    │   └── work.json         Selected work (thumbnails)
    ├── _includes/
    │   ├── layouts/          One layout per page type (base wraps them all)
    │   └── partials/         Header, footer, page intro, button, work card
    ├── pages/
    │   ├── en/               English copy, one file per page
    │   └── ar/               Arabic copy, same files, same names
    ├── assets/
    │   ├── css/              tokens → fonts → base → layout → components → pages
    │   ├── js/main.js        Theme toggle, mobile menu, contact form
    │   ├── js/egg.js         Easter Egg Mode: cube field, merge, dock, cube menu
    │   ├── css/egg.css       Egg Mode styles (loaded last)
    │   ├── fonts/            Satoshi and Gambarino go here (see README)
    │   ├── icons/            Favicon
    │   └── images/           portrait/, work/<slug>/, og/ (see README)
    └── 404.njk
```

## Modes and variants

Every screen is designed and checked in **16 variants**: four independent axes, two values each.

| Axis | Values | Set by |
|---|---|---|
| Viewport | desktop (≥ 1024 px) · mobile (< 1024 px) | CSS breakpoints |
| Theme | light · dark | `data-theme` on `<html>`, saved as `theme`; follows the system until a choice is made |
| Language | EN · AR (RTL) | `lang` and `dir` on `<html>`, set by the page path |
| **Mode** | **Normal · Egg** | `data-mode` on `<html>`, kept in `sessionStorage` as `mode` (only `egg` is stored), so closing the tab ends it |

**Normal mode** is the classic site: header links (a menu button on mobile), and on Home a field of floating black cubes with blue touches behind centred copy, with one coral cube to find.
**Egg mode** starts when a visitor taps the coral cube: the cubes assemble, fuse into one cube with a coral aura, and dock into the header. From then on that cube is the menu on every page (a full-screen list; the language and theme tools stay in the header). "Back to the classic menu" returns to Normal. Egg mode lasts for the tab session: it carries across pages, and closing the tab or opening the site in a new one starts in Normal mode. There is no other way into it, and nothing in Normal mode depends on it.

What changes between the two modes:

| | Normal | Egg |
|---|---|---|
| Header navigation | Links (desktop), menu button (mobile) | The cube button; links and menu button hidden |
| Home hero | Cube field, coral cube to find | Copy only; the field is gone |
| Menu | Services dropdown, mobile panel | Full-screen list: Home, Services, About me, Contact |
| Language and theme tools | In the header | Unchanged |

Rules for any change:

1. Check all 16 variants before you call it done. Arabic mirrors every layout; use logical properties and `inset-inline-*`. The cube field itself is symmetrical and the docking target is measured from the header, so it works in both directions.
2. Colours for the cubes are tokens (`--egg-*` in `tokens.css`, light and dark). Do not hard-code colours in `egg.css` or `egg.js`.
3. The coral gradient and glow belong to the merged cube only. Everywhere else the coral stays a hover and accent colour.
4. New global navigation must exist in both places: `site-nav` (Normal) and `egg-menu` (Egg). Both read `src/_data/nav.json`.
5. Reduced motion: no drift, no tumbling, the assembly and docking snap. Keep it that way.
6. Egg mode needs JavaScript. Normal mode works without it.

## Checks and security

```bash
npm test          # static checks on the built site (fast, no browser)
npm run test:e2e  # browser checks with Playwright (first time: npx playwright install chromium)
npm run check     # build + both, run this before every pull request
```

- **Static** (`tests/static.test.js`): every `src/_data` string has EN and AR, every page knows both modes, Egg and burst tokens exist for light and dark, no hard-coded colours in `egg.css` or `egg.js`, security headers and CSP are present, no dangerous script sinks, only allowed outside hosts, no secrets.
- **Browser** (`tests/e2e.test.js`): the 16 variants (viewport x theme x language x mode) through the whole Egg flow (tap the coral cube, dock, open and close the menu, carry Egg to the next page, new tab starts Normal, back to the classic menu), plus keyboard, reduced motion and the marketing slot. The test server applies the headers from `vercel.json`, so any CSP violation fails the run.
- **Headers** (`vercel.json`): CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` and HSTS on every route.
- **CSP and inline scripts:** scripts are `'self'` plus three `sha256` hashes for the small inline scripts in `layouts/base.njk` (js flag, theme restore, mode restore). If you edit one of them, the static test prints the new hash; put it in the `script-src` of `vercel.json`. Inline styles are allowed (`'unsafe-inline'` for `style-src` only). New outside hosts (fonts, form service) must be added to the CSP and to the allowlist in `tests/static.test.js` on purpose.
- Run `npm audit` now and then. The site ships no runtime dependencies; Playwright is a dev tool only.

## Editing

- **Copy:** edit the Markdown file for the page in `src/pages/en/` or `src/pages/ar/`. Shared lists (services, process, work) live in `src/_data/`.
- **Images:** every image is a slot. Until the file exists, a dashed placeholder shows the exact path to use. See `src/assets/images/README.md`.
- **New project:** add an entry to `src/_data/work.json` and a folder `src/assets/images/work/<slug>/`.
- **Styles:** colours, type, spacing and motion are tokens in `src/assets/css/tokens.css`. Components use semantic tokens only. Easter Egg Mode has its own `--egg-*` tokens.
- **Egg Mode strings:** `eggAssemble`, `eggAssembled`, `eggScattered`, `eggExit`, `eggMenu` in `src/_data/ui.json` (English and Arabic).

## Deploy (Vercel)

1. In Vercel, import the GitHub repo `testourimo/aminetestouri.xyz`. Settings come from `vercel.json`, so keep the defaults.
2. Every push to `main` deploys automatically.
3. Add the domain `aminetestouri.xyz` in the project's Domains settings, then set the records Vercel shows in the OVH DNS zone and remove OVH's default A/AAAA records on `@` and `www`.

## Contact form

The form posts to any service that accepts a normal form POST, for example Formspree.
Create a form there and put its URL in `src/_data/site.json` as `formEndpoint`
(e.g. `https://formspree.io/f/abcdwxyz`). Until then the form shows its error message instead of sending.

## Before going live

- Arabic copy is a draft until a native speaker has reviewed it.
- Set `formEndpoint` so the contact form can send.
- Replace the project thumbnail placeholders and add `og/og-default.png`.
