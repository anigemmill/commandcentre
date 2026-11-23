# Command Centre design system

The working reference for building screens. The reasoning and the contrast calculations are in
`docs/specs/09-design-system.md`; the direction is the brief's "Premium Editorial" (`docs/blueprint.md`
§16–§25). This page says what to use and what is built.

| Status | Meaning |
|---|---|
| **Built** | In the repository, tested |
| **Specified** | Rules agreed below and in spec 09; component not built yet (milestone M3) |

## 1. What is built (18 November 2026)

| Piece | File | Status |
|---|---|---|
| Foundation tokens `--oi-*` (spacing, type scale, weights, radius, elevation, motion, layers, layout) | `packages/foundation/tokens.css` | Built |
| Command Centre theme `--cc-*` (brand colours, light and dark values, chart palette, typefaces) | `tokens/command-centre.css` | Built |
| Semantic utilities (Tailwind theme) | `src/app/globals.css` | Built |
| Base styles: body, headings, one focus ring, reduced motion | `src/app/globals.css` | Built |
| Contrast check of every allowed pair, both modes (86 tests) | `src/design/tokens.test.ts` | Built |
| Guard: no raw colours or direct theme tokens in app code | `npm run check:tokens` (CI) | Built |
| Web fonts (Space Grotesk, Inter, Geist Mono) | Font stacks only; loading with `next/font` in M3 | Specified |
| Theme preference (light, dark, follow device) persisted per user | Device setting works now; saved preference in M3 | Specified |
| Components, `/design-system` page, axe checks | — | Specified (M3) |

## 2. Token layers

```
packages/foundation/tokens.css   --oi-*      shared by all three products: structure, no colour, no fonts
tokens/command-centre.css        --cc-*      this product: brand colours, light and dark values, fonts
src/app/globals.css              --color-*   semantic layer = Tailwind utilities used by components
```

- **Components use only the semantic utilities** (or `var(--color-*)`). Never raw hex, never `--cc-*`.
  `npm run check:tokens` enforces this.
- Findable and Reel Deal keep their own palettes and fonts and map them to the same semantic names, so
  a shared component renders in each product's identity (blueprint §22; decisions 17 Nov).
- Dark mode is a separate set of values, not an inversion. It applies when `<html>` has `mode-dark`,
  or when the device prefers dark and `<html>` does not have `mode-light`.

## 3. Colour

Brand colours (`--cc-*`, not for direct use): Deep Forest `#183C35`, Warm Ivory `#F4F1E9`, Muted
Eucalyptus `#A6B5A2`, Charcoal `#252B29`, Soft Stone `#D9D2C4`, Deep Sage `#718777`.

Three of them **cannot carry text** (spec 09 §2): Deep Sage (3.42:1 on ivory), Muted Eucalyptus
(1.91:1) and Soft Stone (1.33:1). The working shades below exist for that reason.

| Utility | Light | Dark | Use |
|---|---|---|---|
| `bg-bg` | Warm Ivory | `#141917` | Page background |
| `bg-surface` | White | `#1D2421` | Cards, panels, tables |
| `bg-surface-muted` | `#E9E5DA` | `#262E2B` | Selected rows, wells |
| `bg-surface-raised` | White | `#262E2B` | Popovers, side panels |
| `text-ink` | Charcoal | `#EDE9DF` | Body text |
| `text-muted` | `#5C6460` | `#B4B9B1` | Metadata, captions |
| `text-accent-ink` | `#55695A` | Eucalyptus | Sage-coloured text |
| `bg-action` / `text-on-action` | Forest / Ivory | Eucalyptus / `#141917` | Primary button; also link colour (`text-action`) |
| `bg-action-hover` | `#234F46` | `#BCC8B8` | Primary hover |
| `bg-secondary` / `text-on-secondary` | Eucalyptus / Charcoal | `#262E2B` / `#EDE9DF` | Secondary button, always with `border-control` |
| `bg-accent-soft` / `text-on-accent-soft` | `#E3E9E0` / Forest | `#24332D` / `#EDE9DF` | Highlights, selected chips |
| `bg-nav-selected` / `text-on-nav-selected` | Forest / Ivory | Forest / `#EDE9DF` | Current navigation item |
| `border-line` | Soft Stone | `#3A4440` | Decorative dividers only |
| `border-control` | `#8C8475` | `#8C8475` | Inputs, checkboxes, secondary outline (≥3:1) |
| `outline-focus` | Forest | Eucalyptus | Focus ring (base style does this) |
| `text-success` / `warning` / `danger` / `info` | `#2F6B45` / `#8A5A00` / `#A33A2B` / `#2D5B7A` | `#9FD1AE` / `#E6C07A` / `#F0A493` / `#9EC3DD` | Status text and icons, always with an icon and a label |
| `text-chart-1` … `chart-6`, `chart-target` | spec 09 §3 | spec 09 §3 | Chart series in fixed order |

Rules: no gradients, neon or glowing "AI" effects in the interface (spec 09 §6). AI output is marked with
the evidence badge and an agent avatar, not with colour. Forest appears in dark mode only as a large
surface behind light text.

## 4. Typography

| Role | Family | Utility | Size / weight |
|---|---|---|---|
| Page title | Space Grotesk | `font-display` | 28–36 px, 600 |
| Section heading | Space Grotesk | `font-display` | 18–22 px, 600 |
| Body, interface | Inter | `font-sans` (default) | 14 px, 400; 1.5 line height |
| Data, timecodes, ids | Geist Mono | `font-mono` + `tabular-nums` | 12–14 px |
| Section label | Geist Mono | `font-mono uppercase` | 12 px, tracking 0.08em |

Headings never exceed weight 600. No decorative type in operational screens. All numbers in tables,
tiles and charts use tabular numerals.

## 5. Spacing and layout

- 4 px scale: `--oi-space-1` (4) … `--oi-space-20` (80). Tailwind's default 4 px spacing utilities
  match it, so `p-4` is 16 px.
- 12-column grid; gutters 16 px on mobile, 24 px from 1024 px; content max 1440 px; reading width 72ch.
- 32–48 px between page sections. Separate groups with headings and rules, not stacked cards.
- Breakpoints: 640, 768, 1024, 1280, 1536 px.

## 6. Components (all Specified, built in M3 on shadcn/ui and Radix)

Every component: light and dark, keyboard operable, visible focus, documented default, hover, active,
focus, disabled, loading and error states, shown on `/design-system` with axe checks.

| Family | Rules |
|---|---|
| **Navigation** | Side nav 248 px expanded, 72 px collapsed (state remembered); current item `aria-current="page"` with `bg-nav-selected`; mobile bottom bar (see `docs/product/navigation-and-information-architecture.md`) |
| **Buttons** | Primary (`bg-action`), Secondary (`bg-secondary` + `border-control`), Ghost, Danger. One primary per view. Loading keeps the button's width. Icon-only buttons need `aria-label`. Minimum 40 px high (44 px on touch, `--oi-control-min`) |
| **Forms** | Visible label always (no placeholder-only labels), help text, inline error with icon linked by `aria-describedby`, `border-control` boundary, errors summarised at the top on submit |
| **Cards** | Flat with `border-line`, no nested cards, header/body/footer slots. KPI tile: label, value (mono, tabular), unit, delta with sign and text, period, source, evidence badge, updated time |
| **Tables** | Sticky header, sortable columns with `aria-sort`, row selection, compact/comfortable density, stacked list under 768 px. Numbers right-aligned and tabular |
| **Dialogues and drawers** | Drawer (side panel) for record detail; modal only for confirmation. Focus trapped, Esc closes, focus returns to the trigger. `--oi-z-panel` / `--oi-z-modal` |
| **Status indicators and badges** | Icon + text always, never colour alone. Evidence badge: `Measured`, `Platform-reported`, `Estimated`, `AI interpretation`, each with its own icon |
| **Charts** | Wrapper requires title, units, period and source; series in fixed palette order plus marker shape and dash; direct labels; keyboard-reachable tooltip; "view as table" on every chart; dashed charcoal "Target" line |
| **Empty states** | What this area is for, and one action. Never a dead end, never fake data |
| **Loading states** | Skeletons matching the final layout; progress is real or indeterminate, never a fake percentage |
| **Error states** | Plain message, what to do, Retry, a support reference. Partial states name what is missing (e.g. "Google Analytics isn't connected") |
| **No-permission and locked states** | Who can give access; for products not subscribed, what the product does and "Add to your plan" |
| **Notifications** | Toast `role="status"` (errors `role="alert"`), not auto-dismissed if it has an action; notification centre for history |
| **Approval card** | What, requester (person or agent), version, diff, evidence; approve, reject, request changes |

## 7. Motion

120 ms hover and press, 200 ms panels and menus, 280 ms page transitions, `--oi-ease`. Inside editing
and data screens, almost none. Under `prefers-reduced-motion` the durations become zero and the base
styles stop animations.

## 8. Accessibility (WCAG 2.2 AA)

- Contrast is tested automatically for every allowed token pair (`src/design/tokens.test.ts`).
- Real `<button>` and `<a>` elements; every input labelled; logical heading order; skip link.
- Visible focus on everything focusable (base style); focus never hidden behind sticky headers
  (WCAG 2.2 2.4.11).
- Targets at least 24 × 24 px (2.5.8); 44 px on touch by token.
- No drag-only interactions (2.5.7): every drag has a button alternative (boards, reordering).
- Charts: table view, not colour alone, keyboard tooltips.
- Tested at 375, 768 and 1280 px with no horizontal scroll.

## 9. Sharing with Findable and Reel Deal

The foundation file has no colours and no fonts, so it can be extracted unchanged into a private
package once a second product adopts it (decided 17 Nov). Reel Deal already follows the same
three-layer pattern (`--rd-*` mapped to Tailwind's `--color-*`), so adopting the foundation there is a
rename of its spacing, type and radius tokens to `--oi-*`, not a redesign.
