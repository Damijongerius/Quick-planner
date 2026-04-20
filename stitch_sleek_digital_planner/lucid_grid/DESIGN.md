# Design System Documentation

## 1. Overview & Creative North Star: "The Digital Sanctuary"

This design system is not just a utility; it is an environment. Most productivity tools feel like rigid spreadsheets—cluttered, anxious, and demanding. Our North Star, **The Digital Sanctuary**, shifts the focus from "doing more" to "focusing better." 

We break the "template" look by rejecting the standard 1px border grid. Instead, we embrace **Soft Minimalism**—an editorial approach that uses generous white space, intentional asymmetry, and tonal layering to create a sense of calm authority. The interface should feel like a high-end physical planner: premium paper stock, light-catching glass, and perfectly weighted typography.

---

## 2. Colors & Surface Logic

Our palette moves beyond simple blues and greys into a sophisticated range of atmospheric tones.

### The "No-Line" Rule
**Borders are a design failure in this system.** Do not use 1px solid lines to separate sections or tasks. Differentiation must be achieved through:
- **Tonal Shifts:** Placing a `surface-container-low` component on a `surface` background.
- **Negative Space:** Using the spacing scale to create "invisible boundaries."

### Surface Hierarchy & Nesting
Think of the UI as a physical stack of materials. 
- **Base Layer:** `surface` (#f8f9fb) – The desk.
- **Structural Sections:** `surface-container` (#eaeff2) – Large grouping areas.
- **Interactive Elements:** `surface-container-lowest` (#ffffff) – The "paper" where the user takes action.

### The "Glass & Gradient" Rule
To add soul to the "efficiency," use Glassmorphism for floating elements (like quick-add menus). Use `surface-container-lowest` at 80% opacity with a 12px backdrop-blur. 
Main CTAs should use a subtle linear gradient from `primary` (#4656b8) to `primary-container` (#8696fd) at a 135-degree angle to provide a soft, tactile depth that flat color cannot replicate.

---

## 3. Typography

We pair the precision of **Inter** with the architectural character of **Manrope**.

- **Display & Headlines (Manrope):** These are our editorial anchors. Use `display-lg` and `headline-md` with tight letter-spacing (-0.02em) to create a "locked-in," professional look. This font carries the "organized" vibe.
- **Body & Labels (Inter):** Inter is used for high-density information (task names, notes). It provides the "efficient" vibe. 
- **Hierarchy Tip:** Use `on-surface-variant` (#596064) for secondary metadata (dates, categories) to create a clear visual step-down from the `on-surface` (#2c3437) primary content.

---

## 4. Elevation & Depth

We avoid the "floating card" cliché. Depth is achieved through **Tonal Layering**.

- **The Layering Principle:** To make a task item stand out, do not add a shadow. Instead, change its background from `surface-container` to `surface-container-lowest`. This creates a "lift" through color value rather than artificial effects.
- **Ambient Shadows:** When an element must float (e.g., a Modal), use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(44, 52, 55, 0.06)`. The shadow color is a tinted version of `on-surface`, never pure black.
- **The "Ghost Border" Fallback:** If a divider is required for accessibility, use `outline-variant` (#acb3b7) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Cards & Task Items
*   **Style:** No borders. Use `surface-container-lowest` for the card body. 
*   **Spacing:** Use `xl` (0.75rem) corner radius for cards and `md` (0.375rem) for internal elements.
*   **Constraint:** Never use a horizontal rule `<hr>` between tasks. Use a 12px vertical gap instead.

### Progress Bars
*   **Track:** `surface-container-highest` (#dce4e8).
*   **Indicator:** A gradient from `tertiary` (#006b60) to `tertiary-fixed-dim` (#7fe6d5). 
*   **Detail:** The container should have a `full` (9999px) radius for a modern, pill-like aesthetic.

### Buttons
*   **Primary:** Gradient fill (Primary to Primary-Container), `on-primary` text, `full` roundedness.
*   **Secondary:** `surface-container-high` background with `primary` text. No border.
*   **Tertiary/Ghost:** No background. Use `label-md` uppercase with increased letter-spacing (0.05em) for an editorial feel.

### Calendar View
*   **Current Day:** `primary-container` background with `on-primary-container` text.
*   **Other Days:** `on-surface` text on `surface` background.
*   **Interaction:** On hover, a day should transition to `surface-container-low`.

### Checkboxes
*   **Unchecked:** A 2px "Ghost Border" using `outline`.
*   **Checked:** `tertiary` (#006b60) fill with a custom "thin-stroke" checkmark in `on-tertiary`.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetrical margins. For example, a larger left margin for headlines to create an editorial "gutter."
- **Do** use `tertiary` (Teal) as a reward color (completion states, progress) and `primary` (Indigo) as a focus color.
- **Do** prioritize "breathing room." If you think you’ve added enough padding, add 8px more.

### Don’t:
- **Don’t** use pure black (#000000) for text. Use `on-surface` (#2c3437) to maintain the "calming" palette.
- **Don’t** use standard Material Design elevations (z-index shadows). Stick to Tonal Layering.
- **Don’t** use high-saturation reds for errors. Use our `error` (#a8364b) which is softened to fit the professional palette.

---

## 7. Spacing & Rhythm

Standardize all layouts on an **8px grid**, but use **24px (3x)** as the default "padding-large" for containers. This exaggerated spacing is what separates this system from a standard "productivity app" and makes it feel like a premium "Sanctuary."