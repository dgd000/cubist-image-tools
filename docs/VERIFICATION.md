# Local verification record

Date: 2026-10-29. This records local checks of the prepared 0.1.0 source, not a public release or a hosted deployment.

## Installation and builds

- macOS 15.1.1 (x86_64); Node.js 22.18.0, npm 10.9.3, TypeScript 5.9.3, Vite 8.3.5, Playwright 1.61.1.
- `npm run build` passed strict TypeScript checking and produced the static `dist/` output.
- Lockfile tarball URLs use the official npm registry. `npm ci --registry=https://registry.npmjs.org` passed with the same pinned versions and integrity hashes; npm reported zero known vulnerabilities at this check.
- Copied the publishable working files to a fresh temporary directory without `.git`, `node_modules`, build output, or access through relative sibling paths. `npm ci` and `npm run build` passed there. This validates an isolated source copy; the remote repository clone must be rechecked after source is pushed.
- Production browser checks loaded the bundled sample and downloaded an actual 800 × 600 PNG through both `npm run preview` and a static server under `/cubist-image-tools/`.

## Automated browser matrix

Command:

```bash
npx playwright test --project=core --project=chromium --project=firefox --project=webkit --workers=2
```

Result: **41 passed, 1 skipped, 0 failed**. Six core tests plus twelve integration scenarios across each browser engine. The WebKit WebP round-trip scenario was skipped because its encoder probe correctly reported no WebP encoder; PNG/JPEG tests passed and the WebP option was disabled.

| Engine | Playwright browser version | Integration result |
| --- | --- | --- |
| Chromium | 149.0.7827.55 | 12 passed |
| Firefox | 151.0 | 12 passed |
| WebKit | 26.5 | 11 passed; WebP round-trip skipped |

Checks include:

- Real downloaded PNG/JPEG/WebP signatures and output dimensions where encoders are available.
- Transparent-pixel preservation and JPEG flattening onto a chosen red background.
- Common/custom crop dimensions, pointer/keyboard positioning, undo/redo/reset, and unlocked resize.
- Source-coordinate mapping after resize, input size bounds, truncated/unsupported headers, animated PNG/WebP rejection, empty files and the 20 MiB cap.
- JPEG EXIF orientation with both bitmap and image-element decoders, plus reopening an exported WebP by signature despite a misleading filename.
- File drop, invalid-input recovery, a slow sample fetch racing with a newer image, no external requests during image operations, and a 390-pixel mobile viewport without horizontal overflow.

## Assets and source review

- Desktop and mobile screenshots in `docs/images/` were captured from the real running UI using the included original illustration.
- The original SVG source and PNG sample are included; no commercial user images were extracted.
- Selected CubistAI core modules and original MIT notices are documented in `THIRD_PARTY_NOTICES.md`.
- The source has no account, payment, AI, environment-variable, remote-font, analytics, or commercial app imports. The sole application fetch loads the same-origin sample.
- Both READMEs prominently link directly to `https://cubistai.app/` immediately below the title. Their maintainer sections and the app footer retain the planned UTM links. This verifies link construction only, not analytics ingestion or conversion attribution.
- The existing Git history contains only the initial README commit. New source is an independent extraction, not the commercial repository's history.

## Limits of verification

Tests ran locally on macOS, using automated browser engines. No physical mobile device, every Safari/iOS version, all possible color profiles, or low-memory device was verified. An initial matrix attempt and isolated build were interrupted by transient disk exhaustion; the build and complete matrix were rerun successfully after space became available.

GitHub Actions, repository visibility/settings, Pages hosting, release publication, community sharing, and analytics/registration/payment attribution have not been executed or verified remotely. Follow `RELEASING.md` for those steps.
