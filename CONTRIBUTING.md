# Contributing to Embedex Virtual Lab

Thanks for your interest. This is a focused educational tool — contributions are welcome but held to a high bar. Read this before opening a PR.

## What will be merged

✅ **Bug fixes** — something is broken, you fixed it, the fix is minimal and targeted  
✅ **New sensor/display components** — adds a `LibraryComponents.jsx` entry + layout  
✅ **New experiment JSON** — follows the existing 15-experiment format exactly  
✅ **Documentation fixes** — wrong information, broken links, unclear instructions  
✅ **Performance improvements** — measurable, with explanation  

## What will not be merged

❌ Refactors "for cleanliness" with no functional change  
❌ Dependency upgrades without a concrete reason  
❌ New pages, new routes, or major UI overhauls  
❌ Changes to the simulation engine without a detailed explanation  
❌ Anything that breaks the frontend build (`npm run build` must pass)  
❌ PRs that touch more than one unrelated area  

## Before you open a PR

1. **Open an issue first** for anything non-trivial. Get a green light before building.
2. Run `cd frontend && npm run build` — it must be zero errors.
3. Test in the browser. Actually use the thing you changed.
4. Keep the diff small. One thing per PR.

## How to add a component

1. Add the component to `frontend/src/components/LibraryComponents.jsx`
2. Add a terminal layout entry to `frontend/src/constants/LibraryComponentLayouts.js`
3. Add a catalog entry to `frontend/src/constants/componentCatalog.js`
4. If it needs simulation, add handling in `frontend/src/engine/PeripheralSimulator.js`
5. Run `npm run build` — zero errors required

## How to add an experiment

Copy an existing JSON from `backend/data/experiments/` and fill in:
- `id`, `title`, `difficulty`
- `aim`, `objective`, `theory` (HTML)
- `procedure` (array of strings)
- `pretest` + `posttest` (3 MCQ questions each, with `correct_answer_index` and `explanation`)
- `feedback`

The experiment preset code goes in `frontend/src/constants/experimentPresets.js` as `solutionCode`.

## Code style

- No new comments explaining *what* code does — only *why* if non-obvious
- No `console.log` left in production paths
- Match the surrounding code style exactly
