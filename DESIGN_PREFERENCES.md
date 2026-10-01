# User Design Preferences & UI Guidelines

This document outlines the design principles, interaction patterns, and UI preferences established for the WCode web application and site ecosystem.

---

## 1. Header & Navigation Architecture
- **Traditional Two-Tier Header**:
  - **Top Row**: Slogan / brand statement aligned on the left, full official SVG logo anchored on the right.
  - **Second Row (Action Bar)**: Primary navigation (`Menu` / hamburger) on the left, utility actions (Theme selector, Info modal, secondary shortcuts) grouped on the right.
  - **Subtle Divider**: Clean, low-contrast border line (`#header-wrapper-divider`) separating the header block from the interactive application canvas.
- **Cross-Site Aesthetic Consistency**:
  - The encoder app (`/`) must maintain strict visual parity with the Cutie content pages (`/about`, `/features`, `/faq`).

---

## 2. Visual Hierarchy & Element Ranking
- **Equivalence of Parallel Stages**:
  - Elements sharing the same functional rank must share identical visual styling.
  - *Example*: The input label ("WCode words" / "Data to encode") and the output badge ("Decoded NUMBER" / "Encoded WCode") share identical pill geometry, typography, border-radius, background tinting, and uppercase letter-spacing so neither overpowers the other.

---

## 3. Icon-First Minimalism
- **No Redundant Labels**:
  - Frequent action buttons in tight or focused workspaces should rely on clear, standard SVG iconography without cluttering text labels.
  - **Paste Button**: Icon-only button with an accessible tooltip/title.
  - **Clear Button**: Icon-only button positioned directly beside the input field row at the natural point of action, rather than in a detached header or far corner.

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

## 7. Input Resilience & Normalization
- **Permissive and Forgiving Inputs**:
  - In decode workflows, swallow leading and trailing boundary noise automatically before validation or tokenizing:
    - Slashes: `/` and `\`
    - Hyphens / Dashes: `-`
    - Whitespace: Leading, trailing, and redundant consecutive spaces.
  - Protects users from copy-paste quirks from chat apps, CLI outputs, or URL paths.

---

## 8. Multi-Theme Harmony & Persistence
- **3-Way Theme Switcher**:
  - Provides **System** (OS auto-detection), **Light**, and **Dark** options.
  - Dropdown menu interface with corresponding iconography.
- **Synchronized State**:
  - Changes must synchronize between local app keys (`wcode_theme`) and the Cutie framework theme keys (`cutie-dark-mode`), updating `data-theme-preference`, `data-theme-resolved`, and root `.dark-mode` classes in unison.
