# Care & Service – Brand Guidelines

> Version 1.0 · June 2025  
> Applies to: Marketing Website · Customer Web-App · Professional Web-App · Admin Dashboard

---

## 1. Brand Essence

* **Mission** – Make quality care and household services accessible and trustworthy everywhere.
* **Values** – Reliability · Empathy · Simplicity · Professionalism· Inclusivity
* **Tone of Voice** – Friendly & plain-spoken, yet expert and reassuring.

---

## 2. Core Palette

| Token | HEX | Usage |
|-------|-----|-------|
| `--care-primary` | `#4A9B8E` | Buttons, links, active states, charts |
| `--care-primary-light` | `#6BB6AB` | Hovers, secondary buttons, subtle highlights |
| `--care-secondary-dark` | `#2D7A6B` | Headings, icons, sidebar text |
| `--care-background-light` | `#E8F4F2` | Soft backgrounds, alternate table rows |
| `--care-success` | `#4CAF50` | Success badges, toast background |
| `--care-warning` | `#FF9800` | Warnings, notice banners |
| `--care-error` | `#F44336` | Errors, destructive buttons |

Dark-mode automatically lightens foreground colors and deepens backgrounds via the supplied CSS variables.

---

## 3. Typography

| Token | Rem | Px | Context |
|-------|-----|----|----------|
| `--text-xs` | 0.75 | 12 | Captions, helper text |
| `--text-sm` | 0.875 | 14 | Labels, table body |
| `--text-base` | 1 | 16 | Paragraphs, form controls |
| `--text-lg` | 1.125 | 18 | Lead paragraphs |
| `--text-xl` | 1.25 | 20 | H4 |
| `--text-2xl` | 1.5 | 24 | H3 |
| `--text-3xl` | 1.875 | 30 | H2 |
| `--text-4xl` | 2.25 | 36 | H1 |

Font-family: **Inter** (system fallbacks).  
`font-weight-medium` = 500 · `font-weight-normal` = 400.

### Mobile adjustments
On screens `< 768 px` the base font increases to prevent iOS zoom and headline sizes scale up automatically (see CSS media queries).

---

## 4. Spacing & Radius

Spacing tokens (`--space-1` … `--space-24`) follow a `4 px` grid.  
`--radius` = 8 px on desktop, softens to `12 px` on mobile for finger-friendly UI.

---

## 5. Breakpoints

| Token | Width |
|-------|-------|
| `--breakpoint-xs` | 475 px |
| `--breakpoint-sm` | 640 px |
| `--breakpoint-md` | 768 px |
| `--breakpoint-lg` | 1024 px |
| `--breakpoint-xl` | 1280 px |
| `--breakpoint-2xl` | 1536 px |

---

## 6. Components

### Buttons

* Primary → `bg-care-primary` `text-white`  
* Secondary → `bg-care-background-light` `text-care-secondary-dark`  
* Destructive → `bg-care-error` `text-white`

Min-height equals `--touch-target-min` to respect accessibility.

### Cards & Modals

* Background `var(--card)` with subtle border `1px solid var(--border)`
* Shadow: `0 1px 3px rgba(16,24,40,.05)`
* Radius `var(--radius)`

### Sidebar (Dashboards)

* Background `var(--sidebar)`
* Active link `color: var(--sidebar-primary)`
* Border‐right `1px solid var(--sidebar-border)`

### Charts

Use tokens `--chart-1 … --chart-5` consistently so dashboards align with the brand colors.

---

## 7. Accessibility

* Color contrast meets **WCAG AA**.  
* Focus rings use `outline-primary` with sufficient thickness (`2px`).
* Motion reduced via `prefers-reduced-motion` queries.
* Touch targets min `44 × 44 px`.

---

## 8. Asset Usage

* Logos provided in the `/public` folder (`CS-Logo`, icon).
* Favicon resides at `/src/app/favicon.ico`.

---

## 9. Voice & Tone Cheat-sheet

| Scenario | Tone |
|----------|------|
| Onboarding | Warm, encouraging |
| Error | Clear, apologetic, solution-oriented |
| Success | Cheerful but concise |

---

## 10. Implementation

1. Import `styles/care-and-service-theme.css` **once** in your root layout.  
2. Use utility classes (`text-care-primary`, `bg-care-primary-light`, etc.) or Tailwind’s `@apply` macro.
3. Stick to design tokens—never hard-code colors or spacing.

---

> **Need Help?** Contact `design@careandservice.com`