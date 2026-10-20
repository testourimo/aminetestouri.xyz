# Fonts

- **Satoshi** (all Latin text) loads from the Fontshare CDN, linked in `src/_includes/layouts/base.njk`.
- **Zain** (Arabic) loads from Google Fonts.
- **Gambarino** (accent serif) is on hold. When it's wanted, put `Gambarino-Regular.woff2` here
  and follow the steps in `src/assets/css/fonts.css`.

To self-host Satoshi instead of the CDN, add `Satoshi-Variable.woff2` here, add an
`@font-face` block for it in `fonts.css`, and remove the Fontshare link from `base.njk`.
