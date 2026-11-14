# AION initial loading — 2026-11-14

## Findings and changes

The original GLB was 5,933,704 bytes: 4,365,576 bytes of geometry buffer views and 1,529,820 bytes of embedded PNGs, plus metadata/padding. There are 41 meshes and 42 nodes. HTML already preloaded the GLB and poster; AionModel already called useGLTF.preload(). Adding the same call again would not fix the delay.

The scene module was requested only after React mounted and IntersectionObserver enabled the viewer. The build now emits a modulepreload link to the actual hashed AionScene chunk. Lazy evaluation and the visibility gate remain intact. No additional Canvas is created.

The GLB now uses EXT_meshopt_compression with no quantization transform, simplification, texture conversion, mesh joining or material deduplication. Size: 4,555,796 bytes, down 23.2%. The installed Drei loader already supplies its bundled Meshopt decoder; no runtime dependency or external decoder URL was added.

Independent decode comparison verified identical vertex attributes and embedded image bytes, preserved node/mesh/material counts, and the same triangle order and winding. Meshopt may cyclically rotate each triangle's three indices, which preserves the triangle and winding. The original Blender exports remain available under ../prototype; the pre-change web asset is also in Git.

The poster, Suspense boundaries, GPU fence readiness check and 600ms opacity fade remain unchanged. A first submitted render is not treated as proof of GPU completion. Tests were updated to decode the compressed geometry rather than interpret compressed bytes as float positions.

## Measurements

Local Vite production preview; Chromium headless with SwiftShader; viewport 1440×1000; three fresh browser contexts per version; network 10 Mbit/s download, 40ms latency. Both versions used the same measurement script and existing full-page image loading. Values are medians in seconds from navigation:

| Event | Before | After |
| --- | ---: | ---: |
| Scene module request starts | 0.592 | 0.051 |
| Scene module response complete | 1.274 | 0.925 |
| GLB response complete | 5.503 | 4.409 |
| Viewer ready (DOM state after GPU confirmation) | 10.838 | 10.085 |
| Poster hidden after fade | 11.530 | 11.144 |

Ready times across runs: before 14.419 / 10.554 / 10.838; after 11.456 / 9.301 / 10.085. All six runs completed with no page errors and one GLB resource entry per navigation. The small sample and software rendering make first-frame timing noisy. Network savings and earlier scene fetching are directly measured; a universal percentage speedup is not established. Several seconds after download are spent in the combined decode/scene setup/shader/render/GPU-completion path under software rendering; these stages were not independently instrumented, so this report does not attribute them to a single cause. Native Safari/iPhone timings remain unmeasured.

## Validation

- npm run build: passed, including TypeScript. Existing large scene chunk warning remains (1.039 MB raw, approximately 288 KB gzip).
- node scripts/check-atelier.mjs: passed, all 27 combinations, 1,000 rapid updates, reset, cache immutability and material/geometry reference checks. Node uses fixture textures; real texture decoding was exercised in Chromium.
- node scripts/check-framing.mjs: passed desktop/mobile orbit and camera framing checks against decoded positions.
- git diff --check: passed.
- Desktop screenshots before/after reviewed; watch, materials and composition preserved. No claim of pixel-identical screenshots because automatic motion and adaptive resolution are active.
- Chromium viewport 390×844, normal and reduced-motion preferences: poster becomes hidden after readiness; Atelier opens and closes with exactly one Canvas. Mobile Atelier screenshot reviewed. This is desktop browser emulation, not a physical touch-device test or native Safari test.

## Reproducing the asset encoding

Use a separate temporary tool directory with @gltf-transform/core@4.5.1, @gltf-transform/extensions@4.5.1 and meshoptimizer. Read the original web GLB using NodeIO registered with ALL_EXTENSIONS and the meshopt.encoder dependency (MeshoptEncoder); await MeshoptEncoder.ready. Create EXTMeshoptCompression, setRequired(true), setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE }), then write the GLB. Despite the encoder mode's name, no quantize() transform is applied: this chooses compression without lossy attribute filters. Compare decoded attributes and triangles before replacing the shipped asset. Do not run the broad optimize command: it can alter node/material structure required by Atelier.

References: https://github.com/pmndrs/drei/blob/master/docs/loaders/gltf-use-gltf.mdx and https://gltf-transform.dev/extensions.

No commit, push or deployment was performed.
