---
name: Inclusive AAC Core
colors:
  surface: '#f7faf9'
  surface-dim: '#d7dbda'
  surface-bright: '#f7faf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f3'
  surface-container: '#ebeeed'
  surface-container-high: '#e6e9e8'
  surface-container-highest: '#e0e3e2'
  on-surface: '#181c1c'
  on-surface-variant: '#564337'
  inverse-surface: '#2d3131'
  inverse-on-surface: '#eef1f0'
  outline: '#897365'
  outline-variant: '#dcc1b1'
  surface-tint: '#944a00'
  primary: '#944a00'
  on-primary: '#ffffff'
  primary-container: '#e67e22'
  on-primary-container: '#502600'
  inverse-primary: '#ffb783'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed023'
  on-secondary-container: '#6f5900'
  tertiary: '#006d37'
  on-tertiary: '#ffffff'
  tertiary-container: '#00b05c'
  on-tertiary-container: '#003a1a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc5'
  primary-fixed-dim: '#ffb783'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#713700'
  secondary-fixed: '#ffe084'
  secondary-fixed-dim: '#eec209'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#6bfe9c'
  tertiary-fixed-dim: '#4ae183'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005228'
  background: '#f7faf9'
  on-background: '#181c1c'
  surface-variant: '#e0e3e2'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  button-label:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 22px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 20px
  label-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  grid-margin: 1rem
  gutter: 0.5rem
  touch-target-min: 48px
  button-padding: 1rem
---

## Brand & Style

The brand personality is grounded in **empowerment, reliability, and cognitive ease**. This design system is specifically engineered for users of Augmentative and Alternative Communication (AAC), prioritizing immediate recognition and motor-skill accessibility over decorative flair.

The visual style follows a **Modern Corporate** approach mixed with **High-Contrast Functionalism**. It utilizes a clean, structured layout where every element has a clear purpose. To reduce cognitive load, the interface remains predictable and static, using vibrant pastel categorization to help users locate vocabulary through spatial and color-coded memory. The overall emotional response should be one of confidence and independence.

## Colors

The palette is strategically divided into **Navigation** and **Categorization** roles to aid visual scanning:

- **Navigation Orange:** Used exclusively for high-level system actions (Back, Home, Settings) to provide a consistent "anchor" for the user.
- **Surface Neutrals:** Backgrounds use a very light grey or off-white to prevent screen glare while maintaining high contrast with text and icons.
- **Categorical Pastels:** Semantic word groups are assigned specific pastel hues (e.g., Pink for nouns, Green for actions). These colors must remain desaturated enough to ensure that black text and high-contrast icons are the primary focal point.
- **Critical Actions:** Destructive actions like "Delete" or "Clear" utilize high-contrast black/white or a safety-red only when necessary for urgent differentiation.

## Typography

This design system uses **Hanken Grotesk** for its exceptional legibility, open counters, and distinct character shapes, which are critical for users with visual impairments or reading difficulties.

- **Legibility First:** All labels on communication buttons use uppercase or high-weight semi-bold styles to maximize visibility against colored backgrounds.
- **Sentence Bar:** The "Message Window" at the top of the screen uses the largest font size to provide clear feedback on the constructed sentence.
- **Scaling:** On mobile devices, font sizes are capped at 18px for labels to ensure text does not overflow the fixed grid buttons.

## Layout & Spacing

The layout utilizes a **Fixed Grid System** to maintain spatial consistency. Users often rely on "motor planning"—the ability to remember where a button is located without looking.

- **The Communication Grid:** A standard 12-column grid that reflows into 4, 6, or 8 columns depending on the user's cognitive settings. Buttons must maintain a consistent aspect ratio (usually 1:1 or 4:3).
- **The Sentence Bar:** A fixed-height container at the top of the interface that persists across all vocabulary pages.
- **The Sidebar:** A vertical navigation strip on the left containing high-frequency anchors (Core Words, Keyboard, Categories).
- **Safe Zones:** Generous gutters (8px - 12px) are used between buttons to prevent "fat-finger" errors and accidental activations.

## Elevation & Depth

To maintain high clarity and minimize visual noise, this system avoids complex shadows and blurs.

- **Flat Tonal Layers:** Depth is expressed through color, not shadow. Active states or selected buttons are indicated by a thick (3px) high-contrast inner stroke or a significant color shift.
- **Low-Contrast Outlines:** Every grid element is contained within a subtle 1px border (#D1D5DB) to define the hit area clearly against the neutral background.
- **Zero Transparency:** Backdrop blurs are prohibited to ensure that text and icons are always rendered on a solid, predictable surface, maximizing contrast ratios for WCAG compliance.

## Shapes

The shape language uses **Rounded (8px)** corners. This creates a friendly, approachable feel while still maintaining a structured, grid-like appearance that helps the user distinguish individual touch targets.

- **Button Containers:** Standard grid buttons use `rounded-md`.
- **Folder Tabs:** Category folders use a unique "tabbed" top edge (rounded only on top-left and top-right) to visually signal that they contain sub-pages.
- **Sentence Bar:** The main display area uses a slightly smaller radius to differentiate the "output" area from the "input" buttons.

## Components

### Communication Buttons
The core component. It consists of a top-aligned text label and a centered, high-contrast icon. The background color denotes the word category.
- **Interaction:** Must provide visual (border change) and optional auditory feedback upon press.

### Sentence Bar (Message Window)
A horizontal bar that collects selected icons. It includes a "Clear" (trash can) button and a "Play" (speak) button. These utility buttons should be high-contrast (Black/White).

### Navigation Folders
Vertical buttons located in the left sidebar. They use the Primary Orange color. They feature a tab-like shape to indicate they open a new vocabulary set.

### Toggle & Sliders
Used in the settings panel. These must be oversized for easy manipulation, with large "thumb" handles for users with limited fine motor control.

### Keyboards
High-contrast grid of letters. Each letter key should be white with a thick black border and bold black text. Special function keys (Space, Delete) should be oversized.
