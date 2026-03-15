# Diode-Inspired 3D Lab Roadmap

This document captures the observable feature set from withdiode.com and translates it into a ground-up implementation plan for our own 3D lab. The work is broken into 12 self-contained phases so each chunk can be completed within a single execution window without exhausting tokens.

## Observed Platform Pillars

- **Browser-first 3D hardware workbench** with drag-and-drop placement of boards, breadboards, discrete components, and wiring blocks.
- **Realistic circuit simulation** that mirrors physical workshops (“Bring your workshop to the web”), implying voltage-aware components, live feedback, and programmable microcontrollers.
- **Component palette** featuring LEDs (multiple colors), resistors, capacitors, tactile switches, 555 timers, NPN/PNP BJTs, IC packages, and power rails.
- **Camera + viewport controls** (orbit, pan, zoom) exposed in-UI so users can inspect builds from any angle.
- **Preset/project gallery** highlighting curated builds users can load instantly.
- **Account onboarding with free tier**, hinting at workspaces/persistence even though pricing tiers are undisclosed.

## Implementation Phases

### Phase 1 – Scene & Engine Scaffolding
- Set up the base Three.js (or react-three-fiber) scene with orbital camera controls, lighting, and ground plane.
- Stub a simulation engine interface that will eventually drive electrical states but initially returns static data.
- Deliverable: `ARLabCanvas` replacement capable of rendering empty scene with camera help overlay.

### Phase 2 – Component Catalog + Metadata
- Define the canonical component catalog (types, model references, pin layouts, parameter defaults) to mirror Diode’s palette.
- Store catalog in `frontend/src/constants/componentCatalog.js` (or new module) with schema ready for presets and runtime instantiation.
- Deliverable: queryable catalog powering UI listings.

### Phase 3 – Asset Pipeline (Boards & Breadboards)
- Model or import optimized GLTF assets for Arduino-class boards, breadboards, and wiring blocks.
- Add pin hotspot metadata for interaction + wiring alignment.
- Deliverable: board/breadboard show up in scene with accurate pin anchors.

### Phase 4 – Discrete Components (LEDs, Resistors, Caps, Switches)
- Create parametric meshes or lightweight GLTFs for each discrete component along with material variants (color, opacity, emissive for LEDs).
- Implement placement helpers to snap legs to breadboard/board nodes.
- Deliverable: user can drop each component type visually, albeit without simulation.

### Phase 5 – Wiring System
- Implement spline-based wire renderer with selectable colors and endpoints tied to pin hotspots.
- Add validation so wires respect breadboard bus/grouping rules.
- Deliverable: wires render between components, editing tools allow move/delete.

### Phase 6 – Circuit Data Model + Preset Loader
- Formalize the circuit JSON schema (components, connections, MCU firmware metadata) and add loader to hydrate the scene.
- Port at least three Diode-inspired presets (e.g., blinking LED, 555 timer oscillator, BJT amplifier) into `CIRCUIT_PRESETS`.
- Deliverable: selecting a preset populates the entire 3D scene and sidebar metadata.

### Phase 7 – AVR/MCU Simulation Bridge
- Connect the existing AVR engine outputs (PORT/PWM) to component render states (LED intensity, servo angle, etc.).
- Expose sandbox register states in HUD overlays similar to Diode’s “live status” cues.
- Deliverable: running code in the sandbox visibly affects the 3D lab.

### Phase 8 – Bidirectional Interaction Sync
- Allow direct manipulation inside the 3D scene (toggle switches, move jumper wires, replace resistor values) and propagate those changes back to `useCircuitStore` and the 2D sandbox.
- Deliverable: 3D lab becomes an equal editor rather than a passive viewer.

### Phase 9 – Advanced Components (Timers, Transistors, ICs)
- Add behavior + visuals for 555 timers, NPN/PNP BJTs, DIP IC placeholders, and transistor bias visualization.
- Update simulation layer to compute approximate analog behavior needed to light LEDs or drive outputs realistically when MCU isn’t the source.
- Deliverable: circuits relying on analog parts function and display correctly.

### Phase 10 – Project Gallery & Preset Cards
- Build a preset gallery UI (thumbnails + descriptions) available in both sandbox and ARLab view.
- Implement “Load preset” actions that hydrate wiring and code snippets simultaneously.
- Deliverable: matches Diode’s featured projects feel while remaining local.

### Phase 11 – Workspace Persistence & Accounts
- Introduce local or backend-backed workspace saving so users can store multiple builds without external services.
- Mirror Diode’s “Sign Up for Free” promise by adding onboarding copy + account hooks (can be mocked initially).
- Deliverable: persisted sessions plus CTA-ready UI.

### Phase 12 – Documentation & Extensibility Guide
- Produce frontend documentation explaining architecture, data flow, and how to add new components or presets.
- Include references to simulation APIs, asset requirements, and testing strategy so future phases can be owned by different agents.
- Deliverable: `frontend/README.md` (or dedicated doc) updated with 3D lab sections.

These phases deliberately group tightly coupled tasks so each pass can be finished end-to-end without excessive context switching. When you signal the next build session, start at Phase 1 and proceed sequentially unless priorities change.
