# 09 · Design token and component specifications

Status: proposed. Covers blueprint §16–§25. Contrast ratios below were calculated with the WCAG 2.x
relative-luminance formula. Targets: 4.5:1 for body text, 3:1 for large text (≥24 px, or ≥18.66 px
bold), control boundaries, focus indicators and chart marks (WCAG 1.4.3, 1.4.11).

## 1. Token architecture (§22, §23)

Three layers, so the three products share foundations without sharing a palette:

| Layer | Prefix | Owned by | Contains |
|---|---|---|---|
| Foundation | `--oi-*` | Shared package (open question 4) | Spacing, type scale, font stacks, radius, shadows, motion, z-index, breakpoints |
| Product theme | `--cc-*` (Reel Deal `--rd-*`, Findable `--fd-*`) | Each product | Brand colours, light and dark sets, chart palette |
| Semantic | `--color-*`, `--chart-*` | Each product maps theme → semantic | `--color-bg`, `--color-surface`, `--color-text`, `--color-action`, `--color-border-control`… |

Components only read semantic tokens. A product theme is a class on `<html>` (`.theme-cc`,
`.mode-dark`), so shared components render in any product's identity. Reel Deal already uses this
pattern (`--rd-*` with theme classes); moving it to the shared foundation means renaming its spacing,
type and radius tokens to `--oi-*` with aliases, not redesigning it.

## 2. Contrast validation of the blueprint palette (§17)

| Pair | Ratio | Verdict |
|---|---:|---|
| Charcoal `#252B29` on Warm Ivory `#F4F1E9` | 12.78 | ✅ body text |
| Deep Forest `#183C35` on Warm Ivory | 10.71 | ✅ text, buttons |
| Warm Ivory on Deep Forest (button label) | 10.71 | ✅ |
| Deep Forest on Soft Stone `#D9D2C4` | 8.04 | ✅ |
| Charcoal on Muted Eucalyptus `#A6B5A2` | 6.70 | ✅ text on eucalyptus fills |
| Deep Forest on Muted Eucalyptus | 5.62 | ✅ |
| Deep Sage `#718777` on Warm Ivory | **3.42** | ❌ body text · ✅ large text, icons, chart marks |
| Deep Sage on white | 3.86 | ❌ body text |
| Muted Eucalyptus on Warm Ivory | **1.91** | ❌ text, ❌ control boundaries: decorative fills only |
| Soft Stone on Warm Ivory | **1.33** | ❌ input borders: decorative dividers only |
| Deep Forest on a charcoal dark background | **≈1.2** | ❌ forest cannot be an action colour in dark mode |

## 3. Command Centre theme tokens

Blueprint colours are kept unchanged. **Added working shades are marked ✚**; each exists only to meet a
contrast target the original cannot.

### Light mode (default)

| Semantic token | Value | Contrast | Use |
|---|---|---:|---|
| `--color-bg` | Warm Ivory `#F4F1E9` | — | App background |
| `--color-surface` | `#FFFFFF` | — | Cards, panels, tables |
| `--color-surface-muted` | Soft Stone `#D9D2C4` at 40% on ivory | — | Selected rows, wells |
| `--color-text` | Charcoal `#252B29` | 12.78 / 14.42 (ivory / white) | Body |
| `--color-text-muted` ✚ | `#5C6460` | 5.40 / 6.09 | Metadata, captions |
| `--color-text-accent` ✚ | Sage ink `#55695A` | 5.23 / 5.91 | Sage-coloured text (Deep Sage itself fails) |
| `--color-action` | Deep Forest `#183C35` | 10.71 | Primary buttons, selected nav, links |
| `--color-action-hover` ✚ | `#234F46` | 8.17 | |
| `--color-on-action` | Warm Ivory | 10.71 | |
| `--color-secondary` | Muted Eucalyptus `#A6B5A2` fill + Charcoal text | 6.70 | Secondary buttons (needs a ✚ border below) |
| `--color-accent-soft` ✚ | `#E3E9E0` (eucalyptus tint) | forest text 9.79 | Selected indicators, highlights |
| `--color-border` | Soft Stone `#D9D2C4` | 1.33 | Decorative dividers only |
| `--color-border-control` ✚ | `#8C8475` | 3.28 / 3.70 | Inputs, checkboxes, secondary button outline |
| `--color-focus` | Deep Forest, 2 px ring + 2 px offset | 10.71 | Every focusable element |
| `--color-success` ✚ | `#2F6B45` | 5.62 | Always with icon + label |
| `--color-warning` ✚ | `#8A5A00` | 5.25 | Always with icon + label |
| `--color-danger` ✚ | `#A33A2B` | 5.82 | Always with icon + label |
| `--color-info` ✚ | `#2D5B7A` | 6.44 | Always with icon + label |

### Dark mode (designed separately, §18)

| Semantic token | Value | Contrast | Use |
|---|---|---:|---|
| `--color-bg` ✚ | Forest-charcoal `#141917` | — | |
| `--color-surface` ✚ | `#1D2421` | — | |
| `--color-surface-raised` ✚ | `#262E2B` | — | Popovers, side panels |
| `--color-text` ✚ | Warm off-white `#EDE9DF` | 14.67 / 13.06 (bg / surface) | |
| `--color-text-muted` ✚ | `#B4B9B1` | 8.90 / 7.93 | |
| `--color-action` | Muted Eucalyptus `#A6B5A2` | 8.26 / 7.35 | Primary buttons (label `#141917`), selected nav, links |
| `--color-border` ✚ | `#3A4440` | — | Decorative dividers |
| `--color-border-control` | Stone-dark `#8C8475` | 4.80 / 4.28 | Inputs |
| `--color-focus` | Muted Eucalyptus ring | 8.26 | |
| `--color-success` ✚ | `#9FD1AE` | 10.33 | |
| `--color-warning` ✚ | `#E6C07A` | 10.32 | |
| `--color-danger` ✚ | `#F0A493` | 8.84 | |
| `--color-info` ✚ | `#9EC3DD` | 9.57 | |

Deep Forest appears in dark mode only as a large brand surface (e.g. the selected-nav background
behind off-white text: 10.71:1), never as text or a thin indicator.

### Chart palette (§21)

All series are ≥3:1 against their surface. Order is fixed so a series keeps its colour across charts.
Series are also distinguished by marker shape and line dash, and lines carry direct labels.

| # | Light | vs ivory | Dark | vs dark bg | Marker |
|---|---|---:|---|---:|---|
| 1 | Forest `#183C35` | 10.71 | Eucalyptus `#A6B5A2` | 8.26 | ● solid |
| 2 | Slate `#3E5C7A` | 6.17 | `#8FB0D1` | 7.87 | ■ dashed |
| 3 | Clay `#A0523A` | 4.94 | `#E0957A` | 7.41 | ▲ dotted |
| 4 | Sage ink `#55695A` | 5.23 | Mint `#7FC2A4` | 8.60 | ◆ dash-dot |
| 5 | Ochre `#9A6A12` | 4.19 | `#D9AE5F` | 8.61 | ▼ long dash |
| 6 | Plum `#6E4D6B` | 6.34 | `#C7A2C3` | 7.95 | ✚ solid thin |

Target vs actual: target is a dashed charcoal line labelled "Target". Evidence class is shown as a
text badge on every chart and tile, never by colour alone.

## 4. Foundation tokens (shared)

| Group | Tokens |
|---|---|
| Type families | `--oi-font-display` Space Grotesk · `--oi-font-body` Inter · `--oi-font-mono` Geist Mono (§19). Reel Deal additionally uses Instrument Serif italic; Command Centre does not (no decorative type in operational screens) |
| Type scale (app) | 12 / 13 / 14 (body) / 16 / 18 / 22 / 28 / 36 px; line-height 1.5 body, 1.2 headings; tabular numerals (`font-variant-numeric: tabular-nums`) for all data |
| Weights | 400, 500, 600 (headings max 600, "strong but restrained") |
| Spacing | 4 px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 |
| Radius | 4 (inputs, badges), 8 (buttons, cards), 12 (panels, modals), 999 (pills) |
| Shadows / elevation | 0 flat (default), 1 card hover, 2 popover, 3 modal; dark mode uses surface steps + a 1 px light border instead of shadows |
| Motion | 120 ms (hover, press), 200 ms (panels, menus), 280 ms (page transitions); ease `cubic-bezier(.2,0,0,1)`; all non-essential motion off under `prefers-reduced-motion` |
| Breakpoints | 640, 768, 1024, 1280, 1536 |
| Layout | 12-column grid, 24 px gutters desktop, 16 px mobile; max content width 1440 px; reading width 72 ch |
| Z-index | nav 10, sticky 20, popover 30, side panel 40, modal 50, toast 60 |

## 5. Component specifications

Every component: light and dark, keyboard operable, visible focus, documented states (default, hover,
active, focus, disabled, loading, error), shown on a `/design-system` page with axe checks in CI.

| Component | Variants and rules |
|---|---|
| Button | Primary (action), Secondary (eucalyptus + control border), Ghost, Danger; sizes sm/md; one primary per view; loading keeps width; icon-only needs `aria-label` |
| Input, Textarea, Select, Combobox | Visible label always, help text, inline error with icon, `aria-describedby`; 40 px min height (44 on touch) |
| Date and range picker | Keyboard grid, typed entry, presets (this week/month/quarter), timezone shown |
| Filters | Chips with counts, "clear all", reflected in URL |
| Navigation | Side nav expanded/collapsed (state persisted), current page `aria-current`; mobile bottom bar |
| Card | Flat with border by default; no nested cards; header, body, footer slots |
| KPI tile | Label, value (mono, tabular), unit, delta with arrow + sign + text, period, source, evidence badge, updated time |
| Table | Sticky header, sortable columns (`aria-sort`), row selection, density compact/comfortable, responsive → stacked list under 768 px |
| Charts | Wrapper requires title, units, period, source; legend + direct labels; tooltip also reachable by keyboard; "view as table" toggle on every chart |
| Status indicator / Badge | Icon + text always; colours from status tokens |
| Evidence badge | `Measured` · `Platform-reported` · `Estimated` · `AI interpretation` with distinct icons |
| Modal, Side panel | Focus trapped, Esc closes, returns focus; side panel for record detail, modal only for confirmation |
| Approval card | What, requester (user or agent), version, diff, evidence, actions approve / reject / request changes |
| Notifications, Toast | Toast `role=status` (errors `role=alert`), not auto-dismissed if actionable |
| Progress | Linear and step; never fake percentages (real progress or indeterminate) |
| Empty, Loading, Error states | Templates per `04` §5; skeletons match final layout |

## 6. Editorial character (§16)

- Generous whitespace: 32–48 px between page sections; content groups separated by rules and
  headings, not by stacking cards.
- Page titles in Space Grotesk 28–36 px; section labels in Geist Mono 12 px uppercase, tracking 0.08em.
- Ivory backgrounds with white working surfaces; forest used sparingly for emphasis and action.
- No gradients in the interface, no neon, no glowing "AI" effects. AI content is marked by the evidence
  badge and a small agent avatar, not by colour.
