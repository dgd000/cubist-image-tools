export interface Size {
  width: number;
  height: number;
}
export interface Rect extends Size {
  x: number;
  y: number;
}
export type ImageMime = "image/png" | "image/jpeg" | "image/webp";
export interface Edit {
  crop: Rect;
  size: Size;
}
export interface ImageAsset extends Size {
  blob: Blob;
  mimeType: ImageMime;
  source: ImageBitmap | HTMLImageElement;
  name: string;
}
export class EditorError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "EditorError";
  }
}
