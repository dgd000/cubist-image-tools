# Cubist Image Tools

**Built and maintained by [CubistAI · cubistai.app](https://cubistai.app/).**

Resize, crop, and convert images directly in your browser. A small, open-source image studio with no accounts, API keys, or image uploads.

[简体中文](README.zh-CN.md) · [Walkthrough](docs/TUTORIAL.md) · [Contributing](CONTRIBUTING.md)

![Cubist Image Tools running with the included still-life sample](docs/images/screenshot.png)

## Features

- Resize to custom pixel dimensions, with optional proportion locking and percentage shortcuts.
- Crop to original, 1:1, 4:3, 3:2, 16:9, 9:16, or custom dimensions. Move the crop by dragging or using arrow keys.
- Export PNG, JPEG, and WebP when the browser provides the encoder.
- Keep transparency in PNG/WebP; choose a background color for JPEG.
- Undo, redo, and reset. Exports use the original decoded image, avoiding cumulative resampling between edits.
- Open a local file, drag and drop, or try the included original sample. Responsive desktop and mobile layouts.

## Quick start

Requires Node.js **20.19+ or 22.12+** and npm. Verified locally with Node.js 22.18.0 and npm 10.9.3.

```bash
git clone https://github.com/dgd000/cubist-image-tools.git
cd cubist-image-tools
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173`. No `.env` file or backend is needed. The sibling CubistAI repository is **not** needed to install, build, or run this project.

```bash
npm run build     # Type-check and produce dist/
npm run preview   # Serve the production build locally
```

`dist/` can be served by a static host, including under a repository subdirectory. An optional, manually triggered [GitHub Pages workflow](.github/workflows/pages.yml) is included; see [publishing instructions](docs/RELEASING.md). No hosted demo is claimed until deployed.

## Usage

1. Click **Open image**, drop a file onto the workspace, or click **Try the sample image**.
2. Under **Resize**, enter a width and height and click **Apply size**. With proportions locked, changing one dimension updates the other. Percentage shortcuts use the current crop at its original source resolution.
3. Under **Crop**, choose a ratio and reposition the frame. **Custom** unlocks crop width and height. Click **Apply crop** to commit the selection.
4. Choose a file format and click **Download**. Download also applies pending resize inputs when the Resize tool is active. Crop selections must be applied first.

Undo/redo use `Ctrl/⌘ Z` and `Ctrl/⌘ Shift Z` outside text inputs. Focus the crop area and use arrow keys to move it; hold Shift for ten-pixel steps. Reset is itself undoable.

Follow the [sample walkthrough](docs/TUTORIAL.md) to turn the included 1600 × 1200 illustration into an 800 × 800 WebP.

## Privacy

Image decoding, cropping, resizing, and export run locally through browser APIs. This application has no upload endpoint, analytics, advertising, remote fonts, or persistent image storage. Reloading discards the editing session. A host still serves the application files and may keep ordinary access logs. Loading the bundled sample fetches that static file from the same host. External links open only when clicked.

## Browser support and limitations

- Inputs: static **PNG, JPEG, WebP**, up to **20 MiB**, **12,000,000 pixels**, and **8,192 pixels per side**. The same pixel/dimension limits apply to exports. Image signatures and dimensions are checked before decoding.
- Animated PNG/WebP, GIF, SVG, HEIC, TIFF, RAW, and multiple-file processing are outside this release. A misleading filename does not bypass format validation.
- WebP export is detected at runtime; unsupported formats are disabled. Actual encoded MIME types are checked to prevent silently downloading a PNG with a WebP extension.
- JPEG/WebP use the browser's encoder at fixed quality `0.92`. File sizes can increase. There is no target-size compressor, batch mode, quality slider, AI editing, or cloud sync.
- Canvas export creates new image data. Do not rely on retaining EXIF, ICC profiles, GPS, DPI, or other source metadata. Browser decoding applies EXIF orientation; results are not guaranteed color-managed or bit-for-bit lossless.
- Crop ratios round to whole pixels. The preview is capped at 1600 pixels; export uses the source image. Very small devices may run out of memory even within the limits.
- Automated browser coverage uses Playwright Chromium, Firefox, and WebKit on macOS; WebKit automation is not a claim of testing every Safari/iOS release. See the [verification record](docs/VERIFICATION.md).

## Development

TypeScript + Vite + native Canvas, with **no runtime package dependencies**. Processing modules in `src/lib/` are separate from the UI in `src/main.ts`.

```bash
npx playwright install chromium
npm test                  # Core tests and Chromium integration tests
npm run check             # Strict TypeScript check

# Optional full browser matrix
npx playwright install chromium firefox webkit
npm run test:browsers
```

Tests inspect real downloaded file headers, dimensions, transparency and JPEG backgrounds, crop history, rejected input, mobile layout, and network requests. CI also runs the browser matrix. To refresh the actual UI screenshots:

```bash
CAPTURE_SCREENSHOTS=1 npm run test:browser
```

Bug reports and contributions are welcome. Include browser/version, reproducible steps, and a non-sensitive sample if possible. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## About CubistAI

Built and maintained by [CubistAI](https://cubistai.app/?utm_source=github&utm_medium=referral&utm_campaign=cubist-image-tools). CubistAI offers separate hosted AI image tools. This repository contains the standalone local utilities only; it does not contain the commercial service, its accounts, billing, or AI APIs.

Selected image-processing logic was adapted from CubistAI's MIT-licensed photo editor. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for provenance, dependency licenses, and sample ownership.

## License

[MIT](LICENSE). The included sample illustration and screenshots are also available under this repository's MIT license.
