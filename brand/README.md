# GreetHub Webkit — Handoff for Claude Code

## Overview
Brand foundations + React UI kit for **GreetHub**, a web + mobile platform for making and sending fully custom greeting cards and picture books. Feel: clean, modern, warm, a little playful — like a handwritten note.

## About these files
`GreetHub Brand Kit.dc.html` is a **high-fidelity design reference** (open in a browser). `src/` is a working starting point in plain React + CSS custom properties — adapt it to the target codebase's conventions (Tailwind, CSS Modules, styled-components, React Native, etc.). If no codebase exists yet, Vite + React + TypeScript is a good default; convert the .jsx files to .tsx.

## Fidelity
Hi-fi. Match colors, type, radii and shadows exactly.

## Install
```js
import { Logo, Button, TemplateCard /* … */ } from './greethub-webkit/src';
```
`src/index.js` imports `tokens.css` and `components.css` (fonts load from Google Fonts in tokens.css). See `src/Example.jsx` for a composed page.

## Design tokens
**Color**
| token | hex | use |
|---|---|---|
| persimmon | #EE5A36 | brand: logo, illustration, progress, accent words in headlines |
| persimmon-ink | #C8441F | primary buttons, links, focus border (AA with white text) |
| persimmon-deep | #9E3115 | hover on primary/links |
| persimmon-tint | #FDE3D8 | focus ring, ghost-button hover |
| marigold | #F5B83D | badges "New", sticker buttons, celebration accents (cocoa text only) |
| blush | #F6C9C0 | soft badges, avatar fill, card themes (plum text) |
| plum | #5B2A4B | dark sections, reverse logo (paper text) |
| cocoa | #2B1E18 | primary text, dark buttons, toasts |
| cocoa-70 | #6B5A50 | secondary text |
| cocoa-40 | #A99888 | placeholder, disabled text, inactive icons |
| twine | #D9CBB6 | hairlines and decorative edges (was input & chip borders; see control-border) |
| control-border | #8C7B6E | `--gh-control-border`: borders of inputs, selects, chips, checkboxes, switch track, dropzone, radio cards, stepper, style tiles. GreetHub deviation from the kit (CX-19, Head of Design 2026-10-13): twine fails WCAG 1.4.11 at 1.3–1.6:1; this is 4.06:1 on white. |
| line | #E8DCC8 | hairlines |
| cream | #F3EADB | alt surface, tracks |
| paper | #FBF6EE | page background |
| white | #FFFFFF | cards |

Ratio per screen ≈ 60% paper/white · 20% cocoa · 10% persimmon · 10% marigold/blush/plum. One persimmon moment per screen. Never persimmon on marigold.

**Type** — Display: *Bricolage Grotesque* 700/800. Text/UI: *Figtree* 400–700.
| style | font | size/line | weight | tracking |
|---|---|---|---|---|
| display | Bricolage | 72/0.95 | 800 | -0.04em |
| h1 | Bricolage | 48/1.05 | 800 | -0.03em |
| h2 | Bricolage | 32/1.1 | 700 | -0.02em |
| h3 | Bricolage | 20/1.25 | 700 | -0.01em |
| body | Figtree | 17/1.6 | 400 | 0 |
| ui | Figtree | 15/1.4 | 600 | 0 |
| label | Figtree | 13/1.4 | 600 | 0.01em |
| button | Figtree | 14 (sm) / 16 (md, lg) | 700 | 0 |

**Radius** 8 (small tiles) · 14 (inputs, media) · 22 (cards, panels) · 999 (buttons, chips, badges, toggles).
**Spacing** 4pt scale: 4 8 12 16 20 24 32 40 48 64 96 120. Section gap on marketing pages 120.
**Shadow**
- rest: `0 1px 2px rgba(43,30,24,.08)`
- raised: `0 1px 0 rgba(43,30,24,.06), 0 12px 32px -16px rgba(43,30,24,.28)`
- lifted: `0 2px 0 rgba(43,30,24,.06), 0 24px 48px -20px rgba(91,42,75,.4)`
- primary button inner edge: `inset 0 -3px 0 rgba(0,0,0,.18)`
- focus ring: `0 0 0 4px #FDE3D8`
**Motion** ease `cubic-bezier(.2,.8,.2,1)`; 150ms for color, 200–250ms for transform. Card hover: rotate→0, translateY(-4px), raised→lifted shadow.

## Logo
Folded-card mark (rounded square, top-right corner folded, marigold flap) + lowercase wordmark "greet**hub**" with "hub" in persimmon. Write "GreetHub" in prose. Variants: light (default), plum bg (paper text, marigold "hub"), persimmon bg (paper card, cocoa text). Min mark size 20px; clear space = fold height. Don't rotate, outline or shadow the mark. SVGs in `assets/` use live text — **outline the text to paths** in Figma/Illustrator before using as production app icons/favicons.

## Components (src/components)
- **Logo / LogoMark** — `size`, `theme: light|plum|persimmon`, `mark`.
- **Button** — `variant: primary|secondary|ghost|dark|sunny`, `size: sm(36)|md(48)|lg(52)`. Pill, Figtree 700. Disabled = cream bg, cocoa-40 text.
- **TextField** — label 13/600 above; 48px input (textarea via `multiline`), radius 14, 1.5px control-border border, paper fill; focus = persimmon-ink border + tint ring + white fill; `error` swaps hint to persimmon-ink.
- **Chip / ChipGroup** — 36px pill, white + control-border border; selected = cocoa fill, paper text. Single select.
- **Toggle** — 48×28 track, 22px thumb, on = persimmon-ink. role=switch.
- **Segmented** — cream track, selected item white with small shadow.
- **Badge** — `tone: new(marigold) | draft(blush/plum) | sent(cocoa) | promo`.
- **Progress** — 8px cream track, persimmon bar, label + %.
- **TemplateCard** — white card, 10px padding, radius 22, 4:5 media radius 14, title 14/700 + aside 12. Resting tilt ±1.5–3° (`tilt` index or degrees) — signature "paper on a table" motif; use tilt in browse grids and hero piles, not in dense lists/editors.
- **Avatar / AvatarStack** — initials on blush/marigold/plum/cream, 3px white ring, -10px overlap, "+N" overflow.
- **Toast** — cocoa pill, marigold dot, optional paper action button.
- **SiteNav** — logo · links (15/600) · Sign in + Start a card.
- **TabBar** (mobile) — 4 tabs + raised 52px persimmon Create button in the center; tap targets ≥44px; respects safe-area inset.

## Screens in the reference
1. **Marketing hero** — nav; promo badge; H1 "Cards that sound like *you.*" (persimmon on "you."); body; primary + secondary CTA; right side: two tilted cards (-6°, +5°) with a plum "Love, Maya" pill sticker overlapping.
2. **Mobile home** — greeting (13px cocoa-70) + display title "Who are we celebrating?" (28/800); upcoming-occasion row card (marigold day-count tile); occasion chips (horizontal scroll); "Your drafts" 2-col grid of TemplateCards; TabBar.

## Voice
Warm, plain, first names. "Your card's on its way to Sam." not "Order #4821 has been successfully processed!" Max one exclamation mark per screen.

## Imagery
All images in the reference are striped placeholders. Real product: user photos and template art. Placeholders use `.gh-placeholder` with `--a`/`--b` CSS vars.

## Files
- `GreetHub Brand Kit.dc.html` — visual reference
- `src/tokens.css`, `src/tokens.js` — tokens (CSS vars + JS)
- `src/components.css` — component styles (BEM-ish `gh-` prefix)
- `src/components/*.jsx` — React components
- `src/index.js` — barrel export · `src/Example.jsx` — usage
- `assets/logo-mark.svg`, `assets/logo-lockup.svg`
