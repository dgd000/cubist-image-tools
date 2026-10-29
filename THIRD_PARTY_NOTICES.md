# Sources, licenses, and assets

## CubistAI image editor

The initial extraction was reviewed against the local `cubistai-next` checkout at commit `774e7a1f145b5dba4d71650ea5144dd7787ad8fb` on 2026-10-29. Its root LICENSE grants MIT terms and carries `Copyright (c) 2023 CubistAI`; that notice and the full permission text are retained in this repository's LICENSE.

| Standalone file       | Original module                                  | Adaptation                                                                                                                |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/decode.ts`   | `src/lib/photo-editor/decode.ts`                 | Header parsing, animation rejection, browser decoder fallback, EXIF-aware decode; removed storage IDs and handoff origins |
| `src/lib/geometry.ts` | `src/lib/photo-editor/geometry.ts`, `reducer.ts` | Size limits, crop bounds, preview scaling; a new source-rectangle edit model replaces matrix/text state                   |
| `src/lib/export.ts`   | `src/lib/photo-editor/export.ts`, `render.ts`    | Canvas encoding, MIME probing, filename handling; simplified rendering to crop/resize and JPEG flattening                 |
| `src/lib/limits.ts`   | `src/config/photoEditor.ts`                      | Retained local file, pixel, dimension, and history limits                                                                 |

The UI, source-rectangle model, tests, documentation, and sample illustration were created for this independent project. No account, payment, analytics, AI handoff, storage, internationalization framework, or commercial application components were imported. The source checkout is not required at runtime or build time.

## Dependencies

There are no runtime package dependencies or CDN resources. Development tools retain their own licenses in their installed packages:

| Direct tool     | License                                              | Source                                  |
| --------------- | ---------------------------------------------------- | --------------------------------------- |
| Vite            | MIT (bundled dependency notices in its `LICENSE.md`) | https://github.com/vitejs/vite          |
| TypeScript      | Apache-2.0                                           | https://github.com/microsoft/TypeScript |
| Playwright Test | Apache-2.0                                           | https://github.com/microsoft/playwright |

The lockfile records the exact dependency graph. Build/test tools and transitive dependencies are not checked into this repository. Preserve their supplied notices if redistributing those tools. Fonts use locally available browser/system fonts; no font files are bundled. Inline SVG UI icons are simple original line drawings.

## Sample and screenshots

`public/examples/still-life.svg` is an original geometric still-life illustration made for this project. `still-life.png` is its rasterized 1600 × 1200 version and is the sample accepted by the editor. The SVG is an editable source asset, not an accepted input format. No third-party photographs, trademarks, stock assets, or commercial user images were copied.

`docs/images/screenshot.png` and `mobile.png` are actual browser captures of this application using that sample. The source, raster, and captures are covered by this repository's MIT license.
