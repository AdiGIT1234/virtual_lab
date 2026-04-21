---
name: Virtual Lab LandingPage — design system and hero architecture
description: Design tokens, hero section stacking context, and TubesBackground CDN integration for LandingPage.jsx
type: project
---

**Tech stack:** React 19, Vite, Tailwind CSS 4, Framer Motion 12, Three.js 0.183.2, @react-three/fiber.

**Styling approach:** Tailwind utility classes + inline `--lp-*` CSS custom props set on the root `<div>` per theme. No separate theme file — vars are computed inline from `theme` context value ("light" | "dark").

**Brand palette:** primary `#00F2FF` (cyan), secondary `#7000FF` (purple), tertiary `#ff3366` (pink), mint accent `#00FFB2`.

**Hero section stacking context (inside `.sticky` container):**
- z-0: `<video>` scroll-synced chip deconstruction background
- z-1: `<TubesBackground>` — CDN-loaded neon tubes, fades to 0 by scrollProgress 0.3
- z-2: video quality gradient overlay (static `<div>`)
- z-3: scroll-driven dark overlay (`<motion.div>` opacity tied to `videoOverlayOpacity`)
- z-5: left/right HUD spec panels (pointer-events-none)
- z-10: hero text `<motion.div>` (fades out by scrollProgress 0.15)
- z-20: CTA buttons row (needs separate z to be clickable above hero text container)

**TubesBackground integration (LandingPage.jsx ~line 91):**
- Self-contained component, no new files
- Dynamic CDN import: `https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js`
- `TubesCursor(canvas, { antialias: true, alpha: true })` — returns `app` with `app.tubes.setColors()` / `app.tubes.setLightsColors()`
- Initial colors: tubes `["#00F2FF", "#7000FF", "#ff3366"]`, lights `["#00F2FF", "#7000FF", "#ff3366", "#00FFB2"]`
- Click on canvas randomizes colors via `randomColors()` helper (defined at module scope, line 16-17)
- Opacity driven by `tubesOpacity = useTransform(heroScrollProgress, [0, 0.3], [0.7, 0])`
- Canvas needs `style={{ touchAction: "none" }}` for correct pointer events
- Cleanup: sets `cancelled = true` and nulls `appRef.current` on unmount

**Why:** Needed an ambient interactive layer that enhances the "at rest" hero state without competing with the scroll-cinematic chip deconstruction effect. Fades out before HUD panels appear (at scrollProgress ~0.12).
