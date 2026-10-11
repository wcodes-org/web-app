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
  - *Example*: The input label ("WCode" / "Email address" / "Data to encode") and the output section label ("WCode" / "Email" / "Number") share identical flat text geometry, typography, and uppercase letter-spacing outside the cards so neither overpowers the other.

---

## 3. Icon-First Minimalism & Button States
- **No Redundant Labels**:
  - Frequent action buttons in tight or focused workspaces rely on clear, standard SVG iconography without cluttering text labels.
  - **Paste Button**: Icon-only button with an accessible tooltip/title.
  - **Clear Button**: Icon-only button positioned directly beside the input field row.
  - **Decoded Action Buttons**: Contextual actions for decoded payloads (e.g. Call Phone, Send SMS, Open URL, Send Email, View on Google Maps) use compact circular icon buttons with floating info tooltip labels positioned above them on hover or focus (`.action-tooltip` at `bottom: calc(100% + 8px)`), eliminating in-place label expansion and ensuring zero layout shift.
  - **Encode Output Info Button**: Encoding metrics (word count, bit count, checksum verification) are housed in a subtle circular "i" icon button pinned to the bottom-right of the encoded box, displaying the full metric breakdown via a floating info tooltip label (`.action-tooltip`) on hover or focus without cluttering the main words display.
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

## 8. Bifurcated Modals Architecture (Wolo Parity)
- **Two Distinct Modals**:
  - Parity with Wolo Code's separation between app usage guidance and corporate/legal/store links:
  - **Info Modal (`#info-modal`) — App Usage**:
    - Connected to the **Info 'i' icon** (`#info-modal-btn`) on the bottom-left flank of `#footer-actions-bar`.
    - Dedicated purely to app usage, format specifications (`\ Word 1 Word 2 Word 3 /`), 1024-word codec overview, CRC-8 error detection, usage steps, direct `/about` link, back/close control, and version indicator (`#info_version_indicator`).
    - Also serves the first-access cookie/privacy acceptance intro (`#info-intro`) on initial visits.
  - **Links & Credits Modal (`#links-modal`) — Links, Credits, and App Store**:
    - Connected to the **'WCode' author link** (`#footer_author`) in the bottom-center footer copyright line (`Copyright © 2026 WCode`).
    - Dedicated to navigation links (About, Grokipedia, WordList, FAQ, Terms of Use, Privacy Policy, Contact, Source Code), social links (Twitter/X, Facebook, YouTube), unified downloads link (`/downloads`), Google Play app store badge, open-source projects credits & credits page link (`/credits`), site disclaimer, and creator attribution (`by Ujjwal Singh`).
    - Does not show the technical version indicator, keeping the focus strictly on discovery and external references.
- **Non-Underlined Brand Link Hover**:
  - Consistent with Wolo parity, neither the `'WCode'` footer author link (`#footer_author`) nor the WCode about link (`#wcode_about a`, `.info-about-link a`) in the info modal display an underline when hovered or focused (`text-decoration: none;`). Logo headers in modal cards also do not underline on hover.
- **Info Modal Back Button Animation & Affordance**:
  - `#info_full_close_button` uses a 48px circular highlight button (`.button_highlight`) with GPU-composited rendering (`transform: translateZ(0); backface-visibility: hidden;`).
  - Smooth hover scaling (`scale(1.05)`) with an elevated glow shadow (`box-shadow: 0 6px 18px rgba(105, 183, 207, 0.55);`), tactile active depression (`scale(0.95)`), and keyboard `:focus-visible` ring.
  - Directional micro-interaction: hovering or focusing the button gently glides the back arrow leftward (`transform: translateX(-3px);`), providing a fluid and intuitive navigational cue without jitter.

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
- **Subtle Outline Contrast for Active Mode Tags**:
  - Active type pill tags (such as 'Auto') use a refined, subtle contrast border outline (`var(--brand-border-subtle)`) rather than a stark high-contrast solid primary line, preserving gentle visual harmony with the soft background tint.

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
  - Subsequent access via the bottom-left Info icon opens the full information card (`#info-full`): format overview (`\ Word 1 Word 2 Word 3 /`), 1024-word tech specs, CRC-8 error detection, step-by-step usage guide, back/close control, and direct link to `wcode.codes/about`.
- **Version Indicator (Wolo Parity)**:
  - Bottom-right corner version toggle (`#info_version_indicator`) showing short version `v1.1.1` at rest.
  - Hover or focus expands width to full version `v1.1.1.1` and displays elapsed time under it (hovering elapsed time reveals UTC timestamp).
  - A click/tap toggles `aria-expanded` to display the local timestamp while keeping the full version visible (hovering local stamp reveals UTC).
- **Scrollbar-Free Compact Layout**:
  - Spacing, line-heights, and element margins inside both modal cards (`.info-dialog-card` and `.links-dialog-card`) are streamlined so content fits cleanly within standard laptop and desktop viewports without triggering internal scrollbars.
  - Backdrop overlay handles graceful scrolling (`overflow-y: auto; align-items: safe center;`) on exceptionally short mobile screens, while the modal cards suppress scrollbars (`scrollbar-width: none`).
  - Version indicator stamp preview uses `display: none` at rest to prevent hidden layout overhang from inducing phantom vertical scrollbars.

---

## 16. Studio Card De-Cluttering & Externalized Controls
- **Flat Text Input Stage Header**:
  - The input stage indicator ("Data to encode" / "WCode") sits outside directly above `#studio-card` (`.studio-label-outside`) as flat uppercase text without pill borders, backgrounds, or button-like outlines, paired with contextual helper buttons (e.g. "My GPS", "Now") when active.
- **Card-Internal Error Check & Centered External Action**:
  - **Error Check in Card**: The error check control is positioned within the input box region at the bottom of `#studio-card` (`.studio-card-options`), labeled simply **Error Check** (omitting technical "CRC-8" notation).
  - **Centered Primary Action**: The main action button ("Encode to WCode" / "Decode WCode") sits centered outside directly beneath the input card (`.controls-bar-outside`).
  - **Output Section**: The output area (`#output-section`) renders beneath the centered action button with its stage indicator ("WCode" in encode mode, format type in decode mode) placed outside directly above `.output-card`, perfectly mirroring the input card's outside stage indicator.
- **Right-Flank Input Actions**:
  - Clear and Paste buttons are vertically stacked beside the input field in `.input-actions-flank` matching the exact 104px height:
    - **Clear button (`#btn-clear`)**: Pinned to the top-right edge.
    - **Paste button (`#btn-paste`)**: Pinned to the bottom-right edge.
    - Both buttons use identical 36px circular footprints with subtle hover-activated backgrounds.
- **Header Profile & Theme Integration (Wolo Parity)**:
  - A circled Profile icon button (`#profile-button`) is placed at the top-right of the header bar (`#header-right-list`), matching Wolo's account architecture.
  - Clicking the profile icon opens the Profile & Settings menu (`#profile-menu`) containing user identity ("Guest") and the **Appearance / Theme selector** (System, Light, Dark).
  - The standalone theme selector is removed from the footer, leaving the bottom actions bar cleanly dedicated to the Info icon on the left, centered copyright and WCode author trigger, and History/Saved drawer toggle on the right.
- **Root Bottom Copyright & Modal Parity**:
  - The copyright notice (`Copyright © 2026`) and author brand trigger (`WCode`) sit at the bottom center of the root page (`#footer-copyright` within `#footer-actions-bar`), cleanly balanced between the bottom-left Info icon and bottom-right Bookmark control.
- **Encode Info Tooltip**:
  - The encoded output box features a discreet circular "i" info icon (`#encode-info-btn`) positioned in the bottom-right corner.
  - Hovering or keyboard focusing reveals a multiline floating tooltip (`.action-tooltip` with `.tooltip-line`):
    - `Input: <count> symbol(s)` (measuring input length with Unicode/surrogate safety).
    - `Output: <count> word(s)`.
    - Verification state (`CRC-8 Verified` / `Standard`) subtly muted at the bottom.
  - Technical bit count and Base-1024 references are excluded.
- **Output Toolbar Zero-Shift Tooltips**:
  - Toolbar action buttons at the bottom of the output section (`Copy`, `Speak`, `Share`, `Save`) are compact 38px circular icon buttons (`.tool-btn`).
  - Expanding text labels on hover are replaced by centered floating tooltips (`.action-tooltip`) positioned directly above each button (`bottom: calc(100% + 8px)`), eliminating all horizontal and vertical layout shifts.
- **Subtle Swap Button (Primary Action Row)**:
  - The mode swap control (`#tool-swap`) sits on the same horizontal line as the primary action button ("Encode to WCode" / "Decode WCode") within `.controls-bar-outside`.
  - Styled as a subtle 36px circular icon button (`.action-btn-subtle`) with muted icon opacity at rest (`0.72`) and soft hover activation (`rgba(2, 132, 199, 0.08)` / dark `rgba(255, 255, 255, 0.08)`), equipped with a zero-shift tooltip ("Swap Mode").
- **Keyboard Tab Navigation Flow**:
  - Pressing `Tab` from either input area (`#encode-input` in encode mode or `#decode-input` in decode mode) intentionally advances directly to the primary action button (`#action-btn-main`, "Encode to WCode" / "Decode WCode") rather than getting caught in the auxiliary clear/paste flank buttons, ensuring a rapid keyboard workflow.

---


## 17. Location Mode Dedicated App Alternate (Wolo Code)
- **Contextual Discovery in Location Mode**:
  - When the user selects **Location** mode (`state.type === 'location'`), a dedicated alternate card (`#location-alternate`) appears directly below the primary action button (`.controls-bar-outside`).
  - Highlights **Wolo Code** (`wolo.codes`) as the specialized location application powered by WCode technology.
  - Features the standard Cutie Wolo Code tile (`/resource/wolo_code.svg` with "wolo.codes" label and external link icon) and descriptive copy explaining that Wolo Code is an alternate dedicated application for GPS coordinates and addresses with 3 words.
  - Automatically hidden across all other data types (Auto, Text, Number, Phone, Email, URL, Date, Time) to maintain a lean, distraction-free workspace.
