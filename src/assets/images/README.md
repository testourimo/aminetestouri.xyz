# Images

Every image on the site has a fixed slot. Until a file exists, the page shows a dashed
placeholder with the expected path. Add the file with that exact name and rebuild:
it replaces the placeholder automatically.

| Slot | Path | Ratio | Suggested size |
|---|---|---|---|
| About portrait | `portrait/portrait.jpg` | 4:5 (cropped) | 1200 × 1500 |
| Project thumbnail | `work/<slug>/thumbnail.webp` | 16:9 | 1600 × 900 |
| Project screens | `work/<slug>/screen-01.webp`, `screen-02.webp`, … | free | 2400 px wide |
| Social share image | `og/og-default.png` | 1.91:1 | 1200 × 630 |

Rules from the design system:

- Real project screens only. No stock photography, no illustration.
- Square corners (`radius-none`). No shadows.
- Prefer `.webp` for photos and screens; keep each file under 300 KB where possible.

Projects are listed in `src/_data/work.json`. To add one, copy an entry, give it a new
`slug`, and create `work/<slug>/` here.
