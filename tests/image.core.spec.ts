import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  aspectCrop,
  clampCrop,
  cropEdit,
  initialEdit,
  validateSize,
} from "../src/lib/geometry";
import { readImageHeader, decodeAsset } from "../src/lib/decode";
import { exportFilename } from "../src/lib/export";

test("bounds reject excessive allocation, fractions and non-finite dimensions", () => {
  for (const [w, h] of [
    [0, 1],
    [1, -1],
    [2.5, 3],
    [NaN, 4],
    [Infinity, 3],
    [8193, 1],
    [4000, 3001],
  ]) {
    expect(() => validateSize(w, h)).toThrow();
  }
  expect(validateSize(4000, 3000)).toEqual({ width: 4000, height: 3000 });
});

test("crop after resize maps back to original pixels without resampling", () => {
  const original = initialEdit({ width: 1600, height: 1200 });
  const resized = { ...original, size: { width: 800, height: 600 } };
  expect(cropEdit(resized, { x: 100, y: 50, width: 400, height: 300 })).toEqual(
    {
      crop: { x: 200, y: 100, width: 800, height: 600 },
      size: { width: 400, height: 300 },
    },
  );
  const square = aspectCrop(resized.size, 1);
  expect(square).toEqual({ x: 100, y: 0, width: 600, height: 600 });
  expect(
    clampCrop({ x: -10, y: 590, width: 2000, height: 400 }, resized.size),
  ).toEqual({ x: 0, y: 590, width: 800, height: 10 });
});

test("real PNG headers are read and truncated or unrelated files fail", () => {
  const png = new Uint8Array(readFileSync("public/examples/still-life.png"));
  expect(readImageHeader(png)).toMatchObject({
    width: 1600,
    height: 1200,
    mime: "image/png",
  });
  for (const bytes of [
    png.slice(0, 20),
    new Uint8Array(),
    new TextEncoder().encode("<svg></svg>"),
  ]) {
    expect(() => readImageHeader(bytes)).toThrow();
  }
});

test("animated PNG and WebP are rejected before decoding", () => {
  const png = new Uint8Array(readFileSync("public/examples/still-life.png"));
  const animatedPng = new Uint8Array(png.length + 12);
  animatedPng.set(png.slice(0, 33));
  animatedPng.set([0, 0, 0, 0, 97, 99, 84, 76, 0, 0, 0, 0], 33);
  animatedPng.set(png.slice(33), 45);
  expect(() => readImageHeader(animatedPng)).toThrow(/Animated/);
  const webp = new Uint8Array(30);
  webp.set(new TextEncoder().encode("RIFF"), 0);
  webp.set(new TextEncoder().encode("WEBPVP8X"), 8);
  webp[16] = 10;
  webp[20] = 2;
  expect(() => readImageHeader(webp)).toThrow(/Animated/);
});

test("export filenames use the actual encoder extension and sanitize paths", () => {
  expect(exportFilename("hello.PNG", "image/webp")).toBe("hello-cubist.webp");
  expect(exportFilename("../unsafe:name.jpeg", "image/jpeg")).toBe(
    ".._unsafe_name-cubist.jpg",
  );
  expect(exportFilename("", "image/png")).toBe("image-cubist.png");
});

test("empty and oversized files fail before the browser decoder is called", async () => {
  for (const blob of [
    new Blob(),
    new Blob([new Uint8Array(20 * 1024 * 1024 + 1)]),
  ]) {
    await expect(decodeAsset(blob, "oversized.png")).rejects.toThrow(/20 MiB/);
  }
});
