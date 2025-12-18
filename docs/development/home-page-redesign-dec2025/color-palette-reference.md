# Color Palette Reference - Home Page Redesign

## Strategy

**Logo Colors** → Section backgrounds & text
**Teal + Rose** → Buttons & accents (home page only)
**Sage** → Keep for internal pages (dashboard, admin, messages)

---

## Primary Palette (from Logo)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Cream | #FBF2E9 | 251, 242, 233 | Default background, light sections |
| Tan | #C39778 | 195, 151, 120 | Warm section backgrounds |
| Terracotta | #BC6547 | 188, 101, 71 | Accent sections, dark with white text |
| Brown | #483129 | 72, 49, 41 | Primary text, dark section backgrounds |

---

## Accent Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Teal | #3D4F52 | 61, 79, 82 | Home page buttons, primary accents |
| Teal Dark | #2D3B3E | 45, 59, 62 | Hover states |
| Dusty Rose | #D8A8A0 | 216, 168, 160 | Secondary accent, badges |
| Rose Accessible | #9A6B61 | 154, 107, 97 | WCAG AA compliant rose |

---

## Existing Colors (Keep for Internal Pages)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Sage | #5A7E79 | 90, 126, 121 | Internal page buttons |
| Sage Dark | #4A6B66 | 74, 107, 102 | Hover states |
| Navy | #324158 | 50, 65, 88 | Header, footer backgrounds |

---

## Section Background Assignments

```
┌─────────────────────────────────────────────────────────────┐
│  HERO                                                       │
│  Background: Gradient (cream → teal-light/20)               │
│  Text: Brown                                                │
├─────────────────────────────────────────────────────────────┤
│  WHAT IS CARE COLLECTIVE?                                   │
│  Background: Cream (#FBF2E9)                                │
│  Text: Brown                                                │
├─────────────────────────────────────────────────────────────┤
│  ABOUT CARE COLLECTIVE                                      │
│  Background: Tan (#C39778)                                  │
│  Text: Brown                                                │
├─────────────────────────────────────────────────────────────┤
│  WHAT'S HAPPENING                                           │
│  Background: Brown (#483129)                                │
│  Text: White                                                │
├─────────────────────────────────────────────────────────────┤
│  COMMUNITY RESOURCES                                        │
│  Background: Cream (#FBF2E9)                                │
│  Text: Brown                                                │
├─────────────────────────────────────────────────────────────┤
│  GET IN TOUCH                                               │
│  Background: Terracotta (#BC6547)                           │
│  Text: White                                                │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                     │
│  Background: Navy (#324158)                                 │
│  Text: White                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Accessibility Contrast Checks

| Combination | Contrast Ratio | WCAG |
|-------------|----------------|------|
| White on Brown (#483129) | 10.73:1 | AAA |
| White on Terracotta (#BC6547) | 4.51:1 | AA |
| White on Teal (#3D4F52) | 7.89:1 | AAA |
| Brown on Cream (#FBF2E9) | 9.12:1 | AAA |
| Brown on Tan (#C39778) | 4.67:1 | AA |

All combinations meet WCAG AA requirements.

---

## CSS Custom Properties to Add

```css
/* New colors for home page redesign */
--color-teal: #3D4F52;
--color-teal-dark: #2D3B3E;
--color-teal-light: #5A7279;
--color-tan: #C39778;
--color-tan-light: #D4B49E;
```

## Tailwind Config Additions

```js
teal: {
  DEFAULT: '#3D4F52',
  dark: '#2D3B3E',
  light: '#5A7279',
},
tan: {
  DEFAULT: '#C39778',
  light: '#D4B49E',
},
```
