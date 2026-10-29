// Adapted from CubistAI's photo editor; see THIRD_PARTY_NOTICES.md.
import { LIMITS } from "./limits";
import { EditorError, type Edit, type Rect, type Size } from "./types";

export function validateSize(width: number, height: number): Size {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1
  )
    throw new EditorError(
      "INVALID_SIZE",
      "Enter whole pixel dimensions of at least 1.",
    );
  if (
    width > LIMITS.maxDimension ||
    height > LIMITS.maxDimension ||
    width * height > LIMITS.maxPixels
  )
    throw new EditorError(
      "PIXEL_LIMIT",
      "Use up to 12 megapixels and 8,192 pixels per side.",
    );
  return { width, height };
}

export function clampCrop(rect: Rect, size: Size): Rect {
  const x = Math.max(0, Math.min(size.width - 1, Math.round(rect.x) || 0));
  const y = Math.max(0, Math.min(size.height - 1, Math.round(rect.y) || 0));
  return {
    x,
    y,
    width: Math.max(1, Math.min(size.width - x, Math.round(rect.width) || 1)),
    height: Math.max(
      1,
      Math.min(size.height - y, Math.round(rect.height) || 1),
    ),
  };
}

export function fitSize(size: Size, longest: number): Size {
  const scale = Math.min(1, longest / Math.max(size.width, size.height));
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

export function aspectCrop(size: Size, ratio: number): Rect {
  if (!Number.isFinite(ratio) || ratio <= 0)
    throw new EditorError("INVALID_RATIO", "Choose a valid crop ratio.");
  const width = Math.min(size.width, size.height * ratio);
  const height = width / ratio;
  return clampCrop(
    {
      x: (size.width - width) / 2,
      y: (size.height - height) / 2,
      width,
      height,
    },
    size,
  );
}

export function cropEdit(edit: Edit, rect: Rect): Edit {
  const crop = clampCrop(rect, edit.size);
  return {
    crop: {
      x: edit.crop.x + (crop.x * edit.crop.width) / edit.size.width,
      y: edit.crop.y + (crop.y * edit.crop.height) / edit.size.height,
      width: (crop.width * edit.crop.width) / edit.size.width,
      height: (crop.height * edit.crop.height) / edit.size.height,
    },
    size: { width: crop.width, height: crop.height },
  };
}

export function initialEdit(size: Size): Edit {
  return {
    crop: { x: 0, y: 0, width: size.width, height: size.height },
    size: { width: size.width, height: size.height },
  };
}
