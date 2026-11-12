# CHRONOS · AION

Stage 4B — a local cinematic concept website by KALLISTO IT-AGENCY.
React, TypeScript, Vite, Motion, Three.js / React Three Fiber / Drei.

## Run

Node.js 20.19+ or 22.12+ is required. Dependencies are already installed in the working project; run `npm install` only for a fresh checkout.

```bash
cd /Users/dmitrij61/Desktop/KALLISTO/CHRONOS/web
npm run dev
```

Open the Local URL printed by Vite, normally http://127.0.0.1:5173/.

```bash
npm run typecheck
npm run build
npm run preview
```

The production build checks TypeScript, copies font licenses and generates `dist/`. No deployment is configured or performed by these commands.

## Structure

- `src/App.tsx` composes Hero, Philosophy, Anatomy, Collection, Beyond Time and Footer.
- `src/sections/` contains the page sections.
- `src/components/` contains accessible navigation, photographs, reveal effects and the existing watch viewer.
- `src/three/` retains the Stage 3.2 materials and Stage 3.3 framing / adaptive DPR.
- `src/styles/global.css` contains the original Hero; `editorial.css` styles the new sections.
- `src/data/image-manifest.json` describes responsive copies in `public/images/chronos/`.
- `scripts/optimize-campaign.py` reproduces copies using the original PNGs in `../prototype/v02/renders/` and an existing Pillow installation. Originals are read only. Prepared copies are sufficient for normal builds.

Anatomy supports arrow keys, Home and End. Explore / Return CTAs activate the existing Hero. The 3D viewer supports mouse, touch activation, buttons and keyboard arrows / Home / Escape; reduced motion disables automatic movement.

Read `STAGE4B_REPORT.md` for the audit, changed files, image mapping and actual browser checks. Earlier 3D details are in `STAGE32_REPORT.md` and `STAGE33_REPORT.md`.

CHRONOS is fictional; AION is a design concept with a decorative mechanism. There are no payments, orders, backend or invented contact details. Font licenses are included by the build. No external HDRI, paid asset or API is required.
