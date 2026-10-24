# Working on aminetestouri.xyz

Eleventy site, English at `/`, Arabic (RTL) at `/ar/`, built on the Amine Testouri design system. See `README.md` for structure and deploy.

## Design for 16 variants, always

Every change is designed, built and checked across four axes:

- **Viewport:** desktop / mobile
- **Theme:** light / dark
- **Language:** EN / AR (RTL)
- **Mode:** Normal / Easter Egg

Easter Egg Mode (`<html data-mode="egg">`) replaces the header links and mobile menu with the merged cube, which opens a full-screen menu. It starts from the coral cube on the Home hero and is remembered on the device. Details and rules: README, section "Modes and variants". Code: `src/assets/js/egg.js`, `src/assets/css/egg.css`, `--egg-*` tokens in `tokens.css`.

When you add or change navigation, a page header or a hero, update both the Normal and the Egg version, and add Arabic copy with the English. When you design or mock up a screen, show the matrix (or say which variants you checked).

## Conventions

- UK English. First person for copy ("I design…"). No em dashes in copy.
- Tokens only; no hard-coded colours. Coral is the accent and the hover colour; blue is the second colour.
- Radius 0 or 2 px. No shadows and no gradients, except the system's CardGlow and the merged Egg cube aura.
- Work in a branch, open a pull request, merge to `main` to deploy (Vercel).
