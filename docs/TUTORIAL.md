# Resize and crop an image into an 800 × 800 WebP

This walkthrough uses the original still-life illustration included in the repository. It requires no account, uploads, or AI service.

## Start the tool

From a fresh checkout, run `npm ci` and `npm run dev`, then open the local URL printed by Vite. Click **Try the sample image**. The source is a 1600 × 1200 PNG; its dimensions appear in the toolbar. You can also open `public/examples/still-life.png` yourself.

![The actual application with the sample open](images/screenshot.png)

## Choose the composition

Click **Crop**, then **1:1**. The default centered selection is 1200 × 1200 with X = 200 and Y = 0. Drag the crop horizontally to frame the vase and orange. For a reproducible centered result, keep X = 200. You can focus the frame and use arrow keys; Shift moves ten pixels.

Click **Apply crop**. The output line now shows **1,200 × 1,200 px**. The original image is still retained in memory; Undo restores the previous view.

## Resize the square

Click **Resize**, leave **Keep original proportions** checked, and enter **800** for Width. Height becomes **800**. Click **Apply size**. The output line now shows **800 × 800 px**.

Percent shortcuts refer to the selected source crop's full resolution, so entering a width is the clearest way to request this exact output size.

## Export

Choose **WebP** and click **Download WebP**. The file is named `still-life-cubist.webp`. If WebP is disabled, your browser has no WebP encoder; choose PNG or JPEG instead. Check the downloaded file's actual dimensions in your image viewer.

WebP and JPEG use browser encoding at fixed quality 0.92. They do not guarantee a smaller file for every image. PNG/WebP preserve transparent pixels; JPEG replaces them with the selected background color.

## What stays local

Only the application files and bundled sample are fetched from the host. Your own images are decoded, edited, and exported in the browser. Reloading discards the session. The tool supports one static PNG/JPEG/WebP at a time, up to 20 MiB and 12 million pixels, with a maximum dimension of 8192 pixels. Canvas re-encoding does not promise to preserve image metadata or original color profiles.

The relevant implementation is in `src/lib/geometry.ts` (crop mapping), `decode.ts` (validation/decoding), and `export.ts` (rendering/encoding). Browser tests download the results and inspect actual dimensions, MIME signatures, and transparency.
