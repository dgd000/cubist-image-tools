// Adapted from CubistAI's MIT-licensed photo editor; see THIRD_PARTY_NOTICES.md.
import { LIMITS } from "./limits";
import { validateSize } from "./geometry";
import { EditorError, type ImageAsset, type ImageMime } from "./types";

export function readImageHeader(bytes: Uint8Array): {
  width: number;
  height: number;
  mime: ImageMime;
  orientation: number;
} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const str = (offset: number, n: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + n));
  const malformed = () =>
    new EditorError(
      "INVALID_IMAGE",
      "This image is damaged or unsupported. Try another JPEG, PNG or static WebP.",
    );
  try {
    if (
      bytes[0] === 137 &&
      str(1, 3) === "PNG" &&
      view.getUint32(4) === 0x0d0a1a0a
    ) {
      if (str(12, 4) !== "IHDR") throw malformed();
      const width = view.getUint32(16),
        height = view.getUint32(20);
      for (let p = 8; p + 12 <= bytes.length; ) {
        const size = view.getUint32(p),
          type = str(p + 4, 4);
        if (type === "acTL")
          throw new EditorError(
            "ANIMATED_IMAGE",
            "Animated images are not supported. Choose a still image.",
          );
        if (size > bytes.length - p - 12) throw malformed();
        p += 12 + size;
      }
      return { width, height, mime: "image/png", orientation: 1 };
    }
    if (str(0, 4) === "RIFF" && str(8, 4) === "WEBP") {
      let width = 0,
        height = 0;
      for (let p = 12; p + 8 <= bytes.length; ) {
        const size = view.getUint32(p + 4, true),
          type = str(p, 4),
          q = p + 8;
        if (size > bytes.length - q) throw malformed();
        if (type === "ANIM" || (type === "VP8X" && bytes[q] & 2))
          throw new EditorError(
            "ANIMATED_IMAGE",
            "Animated images are not supported. Choose a still image.",
          );
        if (type === "VP8X" && size >= 10) {
          width = 1 + bytes[q + 4] + (bytes[q + 5] << 8) + (bytes[q + 6] << 16);
          height =
            1 + bytes[q + 7] + (bytes[q + 8] << 8) + (bytes[q + 9] << 16);
        }
        if (type === "VP8 " && size >= 10 && !width) {
          width = view.getUint16(q + 6, true) & 0x3fff;
          height = view.getUint16(q + 8, true) & 0x3fff;
        }
        if (type === "VP8L" && size >= 5 && !width) {
          const bits = view.getUint32(q + 1, true);
          width = 1 + (bits & 0x3fff);
          height = 1 + ((bits >>> 14) & 0x3fff);
        }
        p = q + size + (size % 2);
      }
      if (!width || !height) throw malformed();
      return { width, height, mime: "image/webp", orientation: 1 };
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      let width = 0,
        height = 0,
        orientation = 1;
      for (let p = 2; p + 4 < bytes.length; ) {
        if (bytes[p++] !== 0xff) throw malformed();
        while (bytes[p] === 0xff) p++;
        const marker = bytes[p++];
        if (marker === 0xda || marker === 0xd9) break;
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        const length = view.getUint16(p);
        if (length < 2 || p + length > bytes.length) throw malformed();
        if (
          [
            0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
            0xce, 0xcf,
          ].includes(marker)
        ) {
          height = view.getUint16(p + 3);
          width = view.getUint16(p + 5);
        }
        if (marker === 0xe1 && str(p + 2, 6) === "Exif\0\0") {
          const t = p + 8,
            little = str(t, 2) === "II";
          const ifd = t + view.getUint32(t + 4, little);
          if (ifd >= t && ifd + 2 <= p + length) {
            const count = view.getUint16(ifd, little);
            for (let j = 0; j < count; j++) {
              const entry = ifd + 2 + j * 12;
              if (entry + 12 > p + length) break;
              if (view.getUint16(entry, little) === 0x112)
                orientation = view.getUint16(entry + 8, little);
            }
          }
        }
        p += length;
      }
      if (!width || !height) throw malformed();
      return { width, height, mime: "image/jpeg", orientation };
    }
  } catch (error) {
    if (error instanceof EditorError) throw error;
    throw malformed();
  }
  throw malformed();
}

export async function decodeAsset(
  blob: Blob,
  name: string,
): Promise<ImageAsset> {
  if (!blob.size || blob.size > LIMITS.maxBytes)
    throw new EditorError(
      "FILE_LIMIT",
      "Choose a non-empty image up to 20 MiB.",
    );
  const header = readImageHeader(new Uint8Array(await blob.arrayBuffer()));
  validateSize(header.width, header.height);
  const normalized =
    blob.type === header.mime ? blob : new Blob([blob], { type: header.mime });
  const source = await loadSource(normalized);
  try {
    // The browser applies EXIF orientation once during decoding.
    const width =
      source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const height =
      source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    validateSize(width, height);
    return {
      blob: normalized,
      mimeType: header.mime,
      source,
      width,
      height,
      name,
    };
  } catch (error) {
    releaseAssetSource(source);
    throw error;
  }
}

export function releaseAssetSource(source: ImageBitmap | HTMLImageElement) {
  if ("close" in source) source.close();
}

export async function loadSource(
  blob: Blob,
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      /* Decode fallback for Safari and unusual JPEGs. */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new EditorError(
      "DECODE_FAILED",
      "Your browser could not open this image. Try a smaller image.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
