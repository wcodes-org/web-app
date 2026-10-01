# User Design Preferences & UI Guidelines

This document outlines the design principles, interaction patterns, and UI preferences established for the WCode web application and site ecosystem.

---

## 1. Header & Navigation Architecture
- **Traditional Two-Tier Header**:
  - **Top Row**: Slogan / brand statement aligned on the left, full official SVG logo anchored on the right.
  - **Second Row (Action Bar)**: Primary navigation (`Menu` / hamburger) on the left, utility actions (Saved Drawer, Theme selector, Info modal) grouped on the right.
  - **No Duplicate Actions**: Keep the utility icon set focused; avoid redundant about/info icons (e.g. a single modal trigger for "About WCode" rather than both an external link and a dialog button).
  - **Subtle Divider**: Clean, low-contrast border line (`#header-wrapper-divider`) separating the header block from the interactive application canvas.
- **Cross-Site Aesthetic Parity**:
  - The encoder app (`/`) must maintain strict visual parity with the Cutie content pages (`/about`, `/features`, `/faq`).

---

## 2. Visual Hierarchy & Element Ranking
- **Equivalence of Parallel Stages**:
  - Elements sharing the same functional rank must share identical visual styling.
  - *Example*: The input label ("WCode words" / "Data to encode") and the output badge ("Decoded NUMBER" / "Encoded WCode") share identical pill geometry, typography, border-radius, background tinting, and uppercase letter-spacing so neither overpowers the other.

---

## 3. Icon-First Minimalism & Button States
- **No Redundant Labels**:
  - Frequent action buttons in tight or focused workspaces rely on clear, standard SVG iconography without cluttering text labels.
  - **Paste Button**: Icon-only button with an accessible tooltip/title.
  - **Clear Button**: Icon-only button positioned directly beside the input field row.
- **Subtle Circle Hover Activation**:
  - The clear button rests completely transparent (no solid border or card fill) and activates a soft, subtle circular background on hover or keyboard focus (`rgba(0,0,0,0.05)` in light mode, `rgba(255,255,255,0.08)` in dark mode).

---

## 4. Progressive Disclosure (Hover & Focus Reveal)
- **Compact Default Footprint**:
  - Secondary toolbars (such as the bottom output action bar: Copy, Speak, Share, Save, Swap) display icons only in their resting state.
- **Contextual Label Reveal**:
  - Text labels smoothly expand or reveal on hover and keyboard focus (`max-width: 0` to `max-width: 80px` with opacity transitions).
  - Keeps the interface uncluttered while preserving immediate discoverability and accessibility.

---

## 5. Color Accents & Contrast Restraint
- **Muted Over Harsh Contrasts**:
  - Toolbar controls and secondary interactive icons use muted gray accents (`var(--text-muted)`) rather than stark black (`#000` / high-contrast darks).
  - Hover states apply subtle primary brand tints (`var(--primary)` / `var(--primary-subtle)`) without aggressive visual jumps.

---

## 6. Layout Stacking over Horizontal Scrolling
- **Wrap and Stack**:
  - Control sets and category/mode selectors (such as the data type pills) must wrap and stack naturally rather than forcing horizontal scrollbars.
  - Keeps all available options immediately visible at a glance without hiding choices behind horizontal overflow clipping.

---

## 7. Input Resilience, Normalization & Lossless Round-Trip
- **Permissive and Forgiving Inputs**:
  - In decode workflows, swallow leading and trailing boundary noise automatically before validation or tokenizing:
    - Slashes: `/` and `\`
    - Hyphens / Dashes: `-`
    - Whitespace: Leading, trailing, and redundant consecutive spaces.
- **Deterministic Round-Trip (Number & Text Encoding)**:
  - Numbers, phone numbers, and text data must encode symmetrically using UTF-8 byte streams (consistent with the Android specification `input.getText().toString().getBytes()`), ensuring numbers like `12345` always round-trip back to `12345` across Auto and explicit type modes rather than colliding with raw binary BigInts.
  - Type state must remain synchronized when swapping modes.

---

## 8. Footer Architecture (Ujnotes & Cutie Parity)
- **Structure**:
  - **Divider**: Centered low-contrast horizontal rule (`#footer-wrapper-divider`, 20% margin on either side).
  - **Social Links**: Clean vector icon row (Twitter/X, Facebook, YouTube) with brand tinting on hover.
  - **Navigation Links**: Site-wide text links (`About`, `Features`, `WordList`, `FAQ`, `Downloads`, `Patents`).
  - **Site Disclaimer**: Centered, readable disclaimer block (`#footer-site-disclaimer`) clarifying informational use and limiting liability.
  - **Rights & Copyright**: Centered copyright attribution and license links.

---

## 9. Multi-Theme Harmony & Persistence
- **3-Way Theme Switcher**:
  - Provides **System** (OS auto-detection), **Light**, and **Dark** options.
  - Dropdown menu interface with corresponding iconography.
- **Synchronized State**:
  - Changes must synchronize between local app keys (`wcode_theme`) and the Cutie framework theme keys (`cutie-dark-mode`), updating `data-theme-preference`, `data-theme-resolved`, and root `.dark-mode` classes in unison.
