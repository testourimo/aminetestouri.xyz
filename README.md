# aminetestouri.xyz

Personal portfolio of Mo.Amine Testouri, product designer.
Built with [Eleventy](https://www.11ty.dev/) on the Amine Testouri design system. English at `/`, Arabic (RTL) at `/ar/`.

## Run it

```bash
npm install
npm run dev     # local server with live reload at http://localhost:8080
npm run build   # static site in _site/
```

## Folder structure

```
.
├── eleventy.config.js        Build config: passthrough, shortcodes, filters
├── netlify.toml              Hosting: build command and publish folder
├── lib/
│   ├── permalink.js          File path → URL (English at root, /ar/ for Arabic)
│   └── shortcodes.js         {% icon %}, {% iso %} pattern, {% figure %} image slots
└── src/
    ├── _data/                Content shared across pages, in both languages
    │   ├── site.json         Name, role, description, signature
    │   ├── nav.json          Sitemap and menu labels
    │   ├── ui.json           Small interface strings
    │   ├── services.json     What I do
    │   ├── process.json      How I work, five steps
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
    │   ├── fonts/            Satoshi and Gambarino go here (see README)
    │   ├── icons/            Favicon
    │   └── images/           portrait/, work/<slug>/, og/ (see README)
    └── 404.njk
```

## Editing

- **Copy:** edit the Markdown file for the page in `src/pages/en/` or `src/pages/ar/`. Shared lists (services, process, work) live in `src/_data/`.
- **Images:** every image is a slot. Until the file exists, a dashed placeholder shows the exact path to use. See `src/assets/images/README.md`.
- **New project:** add an entry to `src/_data/work.json` and a folder `src/assets/images/work/<slug>/`.
- **Styles:** colours, type, spacing and motion are tokens in `src/assets/css/tokens.css`. Components use semantic tokens only.

## Before going live

- Arabic copy is a draft until a native speaker has reviewed it.
- Add the Satoshi and Gambarino font files (Figtree and Newsreader stand in until then).
- Replace the image placeholders and add `og/og-default.png`.
- The contact form uses Netlify Forms; it works once the site is deployed on Netlify.
