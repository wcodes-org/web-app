# User Design Preferences & UI Guidelines

This document outlines the design principles, interaction patterns, and UI preferences established for the WCode web application and site ecosystem.

---

## 1. Header & Navigation Architecture
- **Traditional Header Structure**:
  - **Top Row**: Slogan / brand statement aligned on the left, full official SVG logo anchored on the right.
  - **Root Header Minimalism & Borderless Canvas**: In the root encoder (`/`), the action bar is stripped clean (menu/hamburger icon removed, utility buttons relocated to bottom flanks) providing an ultra-focused workspace while preserving the fixed 142px height. The header separator divider is removed in root for an open, unbordered flow into the interactive canvas.
- **Cross-Site Aesthetic Parity**:
  - The encoder app (`/`) maintains strict visual parity with Cutie content pages (`/about`, `/features`, `/faq`). Slogan and brand logo coordinates remain completely static with zero layout shift.

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

## 8. Root Footer Removal & Info Modal Consolidation (Wolo Parity)
- **Zero-Clutter Root**:
  - The traditional footer (divider, social icon links, text links list, disclaimer text, copyright) is removed entirely from the root application page (`/`).
  - All footer content is relocated into the **Info Modal**:
    - **Navigation Links Table**: About (`/about`), WordList (`/wordlist`), FAQ (`/faq`), Terms (`/terms`), Privacy Policy (`/policy`).
    - **Social Media Icons**: Clean SVG icon row for Twitter/X, Facebook, and YouTube with brand tint hover transitions.
    - **Site Disclaimer**: Centered informational and liability disclaimer block.
    - **Attribution & Rights**: Copyright notices, license links, and author attribution (`by Ujjwal Singh`).

---

## 9. Multi-Theme Harmony & Persistence
- **3-Way Theme Switcher**:
  - Provides **System** (OS auto-detection), **Light**, and **Dark** options.
  - Upward-opening dropdown menu when placed in the bottom actions bar (`bottom: calc(100% + 6px); top: auto; right: 0;`).
- **Synchronized State**:
  - Changes must synchronize between local app keys (`wcode_theme`) and the Cutie framework theme keys (`cutie-dark-mode`), updating `data-theme-preference`, `data-theme-resolved`, and root `.dark-mode` classes in unison.

---

## 10. Zero Header Layout Shift & Viewport Stability
- **Pixel-Locked Header Across All Pages**:
  - Transitioning between the root encoder app (`/`) and Cutie content pages (`/about`, `/features`, `/faq`, etc.) must exhibit **zero layout shift** in the header.
  - Slogan ("digital words") and brand logo coordinates remain completely static down to the exact pixel. Only contextual navigation/utility items vary.
- **Unified Outer Wrapper Hierarchy**:
  - `html`: `min-height: 100%; margin-left: calc(100vw - 100%);` (prevents horizontal jumps when scrollbar appears/disappears).
  - `body`: `min-height: 100%; margin: 0 auto; display: flex; flex-direction: column; overflow-x: hidden;`.
  - `#main-wrapper`: `max-width: 1440px; padding: 0 20px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; flex: auto;`.
  - `#content-wrapper`: `display: flex; flex-direction: column; flex: 1 0 auto; overflow: visible; width: 100%;`.
  - `#header-wrapper`: `max-width: 1240px; height: 142px; margin: 0 auto; padding: 0; flex: none; width: 100%; display: flow-root;`.

---

## 11. Type Bar Hierarchy & Singleton "Auto" Anchor
- **Auto as Singleton Option**:
  - "Time" occupies the first position among explicit data types, and "Auto" is positioned as the final, singleton option wrapped onto its own line (`.types-bar-break { flex-basis: 100%; width: 100%; height: 0; }`).
  - Visually anchors "Auto" as the primary default detection mode, centered cleanly below the specific format options.

---

## 12. Input Panel Stability (Zero Layout Jump between Modes)
- **Dimensional Equivalence**:
  - Toggling between **Encode** and **Decode** modes must produce **zero layout shift or vertical jump** in the input studio.
  - Both `.text-input-field` (Encode) and `.wcode-input-enclosure` (Decode) share uniform dimensions (`height: 104px; box-sizing: border-box; border-radius: var(--radius-md);`).
  - Decode input uses a multi-line `<textarea>` inside `.wcode-input-enclosure` with flanking slash indicators (`\ ... /`) to comfortably handle long word streams without altering container geometry.
- **Zero-Footprint Collapsed States**:
  - The live word suggestions container collapses completely when empty (`.suggestions-container:empty { display: none; min-height: 0; margin: 0; padding: 0; }`), ensuring identical bottom offsets for controls and action buttons across both modes.

---

## 13. Bottom Flank Utilities & Actions Bar
- **Bottom Actions Bar (`#footer-actions-bar`)**:
  - Sits cleanly at the bottom edge within the 1240px container bounds.
  - **Left Flank (`#footer-actions-left`)**: Relocated Info icon button (`#info-modal-btn`) for instant access to technical codec details and consolidated links without header distraction.
  - **Right Flank (`#footer-actions-right`)**: Relocated Theme Switcher (`#theme-selector`) preceded immediately before the Bookmark / Saved Codes drawer toggle (`#drawer-toggle-btn`).
  - No trailing footer block or horizontal rules beneath this utilities bar.

---

## 14. Text-Only Mode Switch Tabs
- **Icon-Free Mode Tabs**:
  - Both **Encode** and **Decode** mode buttons display clean text labels without icons (`<span>Encode</span>`, `<span>Decode</span>`).
  - Eliminates visual clutter while providing clear, prominent tab targets with smooth active transitions.

---

## 15. First-Visit Info Window (Wolo Project Parity)
- **Automatic First-Access Prompt**:
  - On first access or login to root (`note_version` unrecorded in `localStorage`), the Info window opens automatically in intro mode (`#info-intro`).
  - Displays the cookie & privacy acceptance notice with a prominent cyan circular Proceed button (`.button_highlight` with forward arrow SVG).
  - Clicking Proceed sets `localStorage.note_version = CURRENT_NOTE_VERSION` and dismisses the prompt.
- **Full Info Window on Demand**:
  - Subsequent access via the bottom-left Info icon opens the full information card (`#info-full`): format overview (`\ Word 1 Word 2 Word 3 /`), 1024-word tech specs, CRC-8 error detection, navigation links table, social links, disclaimer, and author credits.


