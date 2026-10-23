# aminetestouri.xyz

Personal portfolio of Mo.Amine Testouri, product designer.
Built with [Eleventy](https://www.11ty.dev/) on the Amine Testouri design system. English at `/`, Arabic (RTL) at `/ar/`.

## Run it

```bash
npm install
npm run dev     # local server with live reload at http://localhost:8080
npm run build   # static site in _site/
```

## Sitemap

| Page | English | Arabic | Holds |
|---|---|---|---|
| Home | `/` | `/ar/` | Hero, selected work (scroller), services teaser, Process of work snippet (`#process`) |
| Services | `/services/` | `/ar/services/` | Services |
| About me | `/about/` | `/ar/about/` | Intro and portrait, Experience (`#experience`), then Process of work in detail (`#process`) |
| Contact | `/contact/` | `/ar/contact/` | Contact form |

Old addresses (`/what-i-do/`, `/what-i-do/process/`, `/experience/`) redirect in `vercel.json`. Process of work lives in `src/_data/process.json` (five stages, shared by Home and About); stage graphics come from the `{% isoCols %}` shortcode.

## Folder structure

```
.
├── eleventy.config.js        Build config: passthrough, shortcodes, filters
├── vercel.json               Hosting: build command, output folder, cache headers
├── lib/
│   ├── permalink.js          File path → URL (English at root, /ar/ for Arabic)
│   └── shortcodes.js         {% icon %}, {% iso %} pattern, {% figure %} image slots
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
