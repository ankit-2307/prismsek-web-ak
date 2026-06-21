# PrismSek — Cinematic Homepage Design

**Date:** 2026-06-21
**Status:** Approved

## Concept

A scroll-driven "film reel" homepage for **PrismSek**. The user scrolls through 5 chapters
that follow a beam of light through a prism. Scroll position is the playhead — scrolling
forward/back scrubs the experience. Each chapter has its own procedural 3D scene, mood color,
and ambient audio tone. Chapters initialize lazily (progressive loading), only when approached.

Visual structure borrows from nightfall.ai (clean dark aesthetic, minimal nav, confident
typography) but the homepage itself is an immersive cinematic experience rather than a
standard SaaS layout.

## The 5 Chapters (theme: light through a prism)

| # | Name        | 3D scene (procedural)                                         | Mood          |
|---|-------------|--------------------------------------------------------------|---------------|
| 1 | Genesis     | Single glowing point in a void; slow-rotating wireframe prism forming | Deep indigo   |
| 2 | Refraction  | Glass prism splitting a single beam into a visible spectrum   | Violet → cyan |
| 3 | Spectrum    | Expanding particle field (thousands of points) spreading out  | Teal          |
| 4 | Convergence | Particles pulling back into an ordered crystalline structure  | Amber         |
| 5 | Horizon     | Calm, resolved prism with headline + primary CTA              | Warm rose/white |

## Architecture

Next.js (App Router) + TypeScript. Single homepage.

- **`app/page.tsx`** — renders a fixed full-screen `<canvas>` behind 5 stacked scroll
  sections (5 × 100vh) that provide the scroll length for the film reel, plus the UI overlay.
- **`SceneManager` (Three.js)** — owns a single WebGLRenderer + camera. Holds 5 chapter
  scene modules. **Progressive loading:** each chapter's geometry/particles are built lazily
  the first time the user scrolls near it, not all upfront. Renders only the active (and
  transitioning) chapter.
- **`ScrollDirector` (GSAP + ScrollTrigger)** — maps overall scroll progress (0→1) to the
  active chapter index and intra-chapter animation progress. `timeline.progress()` is driven
  by scroll position (the "film reel").
- **`AudioEngine` (Web Audio API)** — one oscillator + filter chain per chapter, crossfaded
  at chapter milestones. AudioContext stays suspended until the first user gesture
  (click/scroll) per browser autoplay policy. Exposes a mute toggle.
- **`MoodController`** — sets CSS custom properties (`--bg`, `--fg`, `--accent`) on `:root`
  per chapter, so the entire UI mood shifts between chapters via CSS variables.
- **UI overlay** — minimal fixed nav (PRISMSEK wordmark + mute toggle), per-chapter
  title/subtitle that fades in/out, a scroll hint on chapter 1, and the final CTA on chapter 5.

## Data Flow

```
scroll → ScrollTrigger → normalized progress (0..1)
   ├─→ SceneManager   (init-if-needed + render active chapter)
   ├─→ AudioEngine    (crossfade tones at milestones)
   ├─→ MoodController (update CSS custom properties)
   └─→ Overlay        (swap chapter title/copy)
```

## Components & Interfaces

- `SceneManager.update(globalProgress: number)` — figures active chapter, lazy-inits it,
  updates its animation, renders.
- `ScrollDirector` — wires ScrollTrigger to a single `onUpdate(progress)` callback that fans
  out to the other modules.
- `AudioEngine.start()` / `.setChapter(i, blend)` / `.toggleMute()`.
- `MoodController.apply(chapterIndex, blend)` — lerps CSS variables between adjacent chapters.
- Each chapter scene module: `{ init(scene), update(localProgress), dispose() }`.

## Error Handling / Robustness

- WebGL unavailable → render a static gradient fallback with the chapter copy (no crash).
- AudioContext blocked → site works silently; mute toggle reflects state.
- `prefers-reduced-motion` → reduce/limit animation intensity.
- Resize → renderer + camera aspect updated on window resize.

## Tech Stack

`next`, `react`, `react-dom`, `three`, `gsap`. Plain CSS using custom properties.
Local run: `npm install && npm run dev`.

## Out of Scope (for now)

- Real `.glb` / Draco-compressed model assets (procedural geometry instead).
- Pointer-events long-press environment variations.
- Additional pages, routing, backend, CMS.

## Success Criteria

- `npm run dev` serves a homepage that scrolls through all 5 chapters smoothly.
- 3D scene visibly changes per chapter; mood colors shift; ambient audio crossfades
  (after a user gesture) with a working mute toggle.
- No external 3D asset downloads required; works offline after `npm install`.
