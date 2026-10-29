// Adapted from CubistAI's photo editor; see THIRD_PARTY_NOTICES.md.
import { validateSize, fitSize } from "./geometry";
import { LIMITS } from "./limits";
import {
  EditorError,
  type Edit,
  type ImageAsset,
  type ImageMime,
} from "./types";

export function renderImage(
  canvas: HTMLCanvasElement,
  asset: ImageAsset,
  edit: Edit,
  preview = false,
  background?: string,
) {
  validateSize(edit.size.width, edit.size.height);
  const size = preview
    ? fitSize(edit.size, LIMITS.previewDimension)
    : edit.size;
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new EditorError(
      "CANVAS_UNAVAILABLE",
      "This browser could not create an image canvas.",
    );
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size.width, size.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const { x, y, width, height } = edit.crop;
  ctx.drawImage(
    asset.source,
    x,
    y,
    width,
    height,
    0,
    0,
    size.width,
    size.height,
  );
}

export function canvasBlob(
  canvas: HTMLCanvasElement,
  mime: ImageMime,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => {
        if (!blob)
          reject(
            new EditorError(
              "ENCODE_FAILED",
              "Export failed. Try a smaller image.",
            ),
          );
        else if (blob.type !== mime)
          reject(
            new EditorError(
              "FORMAT_UNSUPPORTED",
              "This browser cannot export that format. Choose another format.",
            ),
          );
        else resolve(blob);
      },
      mime,
      0.92,
    ),
  );
}

export async function supportedExportFormats(): Promise<ImageMime[]> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const formats: ImageMime[] = [];
  for (const mime of ["image/png", "image/jpeg", "image/webp"] as ImageMime[]) {
    try {
      await canvasBlob(canvas, mime);
      formats.push(mime);
    } catch {
      /* Probe actual encoder support. */
    }
  }
  return formats;
}

export async function exportImage(
  asset: ImageAsset,
  edit: Edit,
  mime: ImageMime,
  background = "#ffffff",
) {
  const canvas = document.createElement("canvas");
  try {
    renderImage(
      canvas,
      asset,
      edit,
      false,
      mime === "image/jpeg" ? background : undefined,
    );
    return await canvasBlob(canvas, mime);
  } finally {
    canvas.width = canvas.height = 1;
  }
}

export function exportFilename(name: string, mime: ImageMime) {
  const base =
    name
      .trim()
      .replace(/\.[^.]+$/, "")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .slice(0, 100) || "image";
  return `${base}-cubist.${mime === "image/jpeg" ? "jpg" : mime.split("/")[1]}`;
}
