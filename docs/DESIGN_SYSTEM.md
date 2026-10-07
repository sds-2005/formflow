# FormFlow — Design System

## 1. Brand Identity

**Name:** FormFlow
**Tagline:** "Build beautiful forms, effortlessly."
**Personality:** Clean, modern, professional, approachable — inspired by Typeform's warmth without copying its identity.

## 2. Color Palette

### Core Colors
```css
:root {
  /* Backgrounds */
  --color-bg-primary: #FAF9F7;       /* Warm off-white workspace */
  --color-bg-secondary: #FFFFFF;     /* Cards, panels */
  --color-bg-canvas: #F5F3F0;       /* Builder canvas */
  --color-bg-dark: #1A1A2E;         /* Dark surfaces (public form) */
  --color-bg-hover: #F0EEEB;        /* Hover state */
  --color-bg-selected: #EDE9E3;     /* Selected state */

  /* Primary */
  --color-primary: #191919;         /* Deep charcoal — primary actions */
  --color-primary-hover: #333333;
  --color-primary-text: #FFFFFF;

  /* Text */
  --color-text-primary: #191919;
  --color-text-secondary: #6B6B6B;
  --color-text-tertiary: #9B9B9B;
  --color-text-inverse: #FFFFFF;
  --color-text-placeholder: #B3B3B3;

  /* Borders */
  --color-border-primary: #E5E2DD;
  --color-border-secondary: #D4D0CA;
  --color-border-focus: #191919;
  --color-border-error: #E74C3C;

  /* Status */
  --color-success: #27AE60;
  --color-success-bg: #E8F8F0;
  --color-error: #E74C3C;
  --color-error-bg: #FDE8E6;
  --color-warning: #F39C12;
  --color-warning-bg: #FEF5E7;
  --color-info: #3498DB;
  --color-info-bg: #E8F4FD;

  /* Question Markers — pastel accents */
  --color-marker-1: #B8A9E8;  /* Lavender */
  --color-marker-2: #8DC6E8;  /* Sky blue */
  --color-marker-3: #F7DC6F;  /* Soft yellow */
  --color-marker-4: #82E0AA;  /* Mint green */
  --color-marker-5: #F1948A;  /* Coral */
  --color-marker-6: #85C1E9;  /* Periwinkle */
  --color-marker-7: #F0B27A;  /* Peach */
  --color-marker-8: #A3E4D7;  /* Teal */

  /* Draft/Published badges */
  --color-badge-draft-bg: #F5F3F0;
  --color-badge-draft-text: #6B6B6B;
  --color-badge-published-bg: #E8F8F0;
  --color-badge-published-text: #27AE60;
}
```

### Public Form Colors
The respondent experience uses a darker, more immersive palette:
```css
.public-form {
  --color-bg: #1A1A2E;
  --color-text: #FFFFFF;
  --color-text-secondary: #B3B3CC;
  --color-input-bg: rgba(255, 255, 255, 0.08);
  --color-input-border: rgba(255, 255, 255, 0.2);
  --color-input-focus: rgba(255, 255, 255, 0.4);
  --color-button-bg: #FFFFFF;
  --color-button-text: #1A1A2E;
  --color-progress: #B8A9E8;
}
```

## 3. Typography

**Font family:** Inter (loaded via `next/font/google` — no runtime remote dependency)

```css
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Scale */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */

  /* Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Type Hierarchy
| Element | Size | Weight | Color |
|---|---|---|---|
| Page heading | `--text-2xl` | semibold | primary |
| Section heading | `--text-xl` | semibold | primary |
| Form title (workspace) | `--text-base` | medium | primary |
| Body text | `--text-base` | regular | primary |
| Secondary text | `--text-sm` | regular | secondary |
| Caption/meta | `--text-xs` | regular | tertiary |
| Question text (respondent) | `--text-3xl` | semibold | inverse |
| Question help (respondent) | `--text-lg` | regular | text-secondary |

## 4. Spacing

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

## 5. Borders and Radii

```css
:root {
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  --border-width: 1px;
  --border-style: solid;
  --border-default: var(--border-width) var(--border-style) var(--color-border-primary);
}
```

## 6. Shadows

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.12);
  --shadow-focus: 0 0 0 3px rgba(25, 25, 25, 0.15);
}
```

## 7. Transitions

```css
:root {
  --transition-fast: 120ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
  --transition-question: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: 0ms;
    --transition-normal: 0ms;
    --transition-slow: 0ms;
    --transition-question: 0ms;
  }
}
```

## 8. Z-Index Scale

```css
:root {
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;
}
```

## 9. Touch Targets

- Minimum interactive size: 44×44px
- Button padding: minimum `--space-3` vertical, `--space-4` horizontal
- List items: minimum 48px height
- Mobile: generous tap targets with spacing between adjacent interactive elements

## 10. Component Patterns

### Buttons
- **Primary:** `--color-primary` bg, `--color-primary-text` text, `--radius-md`
- **Secondary:** transparent bg, `--border-default`, `--color-text-primary`
- **Ghost:** transparent bg, no border, `--color-text-secondary`
- **Danger:** `--color-error` bg when confirming destructive action
- All buttons: `--transition-fast` for hover/active states

### Inputs
- Height: 44px minimum
- Border: `--border-default`, `--radius-md`
- Focus: `--color-border-focus` border + `--shadow-focus`
- Error: `--color-border-error` border + error message below
- Placeholder: `--color-text-placeholder`

### Cards
- Background: `--color-bg-secondary`
- Border: `--border-default`
- Radius: `--radius-lg`
- Shadow: `--shadow-sm`
- Hover: `--shadow-md`

### Badges
- Draft: `--color-badge-draft-bg/text`, `--radius-full`, `--text-xs`
- Published: `--color-badge-published-bg/text`, `--radius-full`, `--text-xs`

### Toast Notifications
- Position: bottom-right
- Width: 360px max
- Auto-dismiss: 4s (success), persistent (error)
- Types: success (green), error (red), info (blue), warning (yellow)
- Close button always visible

### Modals/Dialogs
- Overlay: `rgba(0, 0, 0, 0.4)`
- Content: `--color-bg-secondary`, `--radius-xl`, `--shadow-xl`
- Max width: 480px
- Focus trapped
- Escape to close

### Skeleton Loaders
- Background: `--color-bg-hover`
- Shimmer animation: subtle left-to-right gradient sweep
- Match exact layout shapes

## 11. Responsive Breakpoints

```css
/* Mobile first */
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
```

### Builder Responsive Behavior
- **≥1024px:** Full three-pane layout
- **768-1023px:** Canvas + toggle drawers for navigator/inspector
- **<768px:** Full-width canvas + bottom sheet drawers
- Public respondent flow: mobile-first, works beautifully at all sizes

## 12. Accessibility Tokens

- Focus ring: 3px solid with offset, visible on all interactive elements
- Error text: never color-only — includes icon and text
- Contrast: all text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Motion: all animations respect `prefers-reduced-motion`
