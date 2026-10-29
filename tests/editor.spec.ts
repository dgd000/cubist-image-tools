import { test, expect, type Page } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import { readImageHeader } from "../src/lib/decode";

async function loadSample(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the sample image" }).click();
  await expect(page.locator("#file-name")).toHaveText("still-life.png");
  await expect(
    page.getByRole("button", { name: "Download PNG" }),
  ).toBeEnabled();
}
async function download(
  page: Page,
  mime: string,
  width: number,
  height: number,
) {
  await page.locator("#format").selectOption(mime);
  const pending = page.waitForEvent("download");
  await page.locator("#download").click();
  const file = await pending;
  const path = await file.path();
  const bytes = await readFile(path!);
  expect(readImageHeader(new Uint8Array(bytes))).toMatchObject({
    mime,
    width,
    height,
  });
  return { bytes, name: file.suggestedFilename() };
}

test("resize keeps proportions and exports real PNG, JPEG and WebP files", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await loadSample(page);
  await page.locator("#width").fill("800");
  await expect(page.locator("#height")).toHaveValue("600");
  await page.getByRole("button", { name: "Apply size" }).click();
  for (const mime of ["image/png", "image/jpeg", "image/webp"]) {
    if (await page.locator(`option[value="${mime}"]`).isDisabled()) continue;
    const result = await download(page, mime, 800, 600);
    expect(result.name).toMatch(/^still-life-cubist\.(png|jpg|webp)$/);
  }
  expect(errors).toEqual([]);
});

test("crop, keyboard positioning, undo, redo and reset preserve the source", async ({
  page,
}) => {
  await loadSample(page);
  await page.getByRole("button", { name: "Crop", exact: true }).click();
  await page.getByRole("button", { name: "1:1", exact: true }).click();
  await expect(page.locator("#crop-x")).toHaveValue("200");
  await page.locator("#crop-selection").focus();
  await page.keyboard.press("Shift+ArrowRight");
  await expect(page.locator("#crop-x")).toHaveValue("210");
  await page.getByRole("button", { name: "Apply crop" }).click();
  await download(page, "image/png", 1200, 1200);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("#output-detail")).toHaveText(
    "Output: 1,600 × 1,200 px",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.locator("#output-detail")).toHaveText(
    "Output: 1,200 × 1,200 px",
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await download(page, "image/png", 1600, 1200);
});

test("custom crop dimensions and unlocked resizing export the chosen dimensions", async ({
  page,
}) => {
  await loadSample(page);
  await page.getByRole("button", { name: "Crop", exact: true }).click();
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await page.locator("#crop-width").fill("500");
  await page.locator("#crop-width").blur();
  await page.locator("#crop-height").fill("350");
  await page.locator("#crop-height").blur();
  await page.getByRole("button", { name: "Apply crop" }).click();
  await page.getByRole("button", { name: "Resize", exact: true }).click();
  await page.getByLabel("Keep original proportions").uncheck();
  await page.locator("#width").fill("240");
  await page.locator("#height").fill("100");
  // Download also applies the current resize inputs.
  await download(page, "image/png", 240, 100);
});

test("PNG/WebP keep alpha and JPEG flattens onto the chosen background", async ({
  page,
}) => {
  await page.goto("/");
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    canvas.getContext("2d")!.fillRect(0, 0, 8, 8);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png"),
    );
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  await page.locator("#file-input").setInputFiles({
    name: "alpha.png",
    mimeType: "image/png",
    buffer: Buffer.from(bytes),
  });
  await expect(page.locator("#file-name")).toHaveText("alpha.png");
  for (const mime of ["image/png", "image/webp", "image/jpeg"]) {
    if (await page.locator(`option[value="${mime}"]`).isDisabled()) continue;
    await page.locator("#background").evaluate((node: HTMLInputElement) => {
      node.value = "#ff0000";
    });
    const { bytes: result } = await download(page, mime, 32, 32);
    const pixel = await page.evaluate(
      async ({ bytes, mime }) => {
        const blob = new Blob([new Uint8Array(bytes)], { type: mime });
        const image = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 32;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0);
        image.close();
        return Array.from(ctx.getImageData(24, 24, 1, 1).data);
      },
      { bytes: [...result], mime },
    );
    if (mime === "image/jpeg") {
      expect(pixel[0]).toBeGreaterThan(245);
      expect(pixel[1]).toBeLessThan(10);
      expect(pixel[3]).toBe(255);
    } else expect(pixel[3]).toBe(0);
  }
});

test("invalid images and dimensions leave the current image usable", async ({
  page,
}) => {
  await loadSample(page);
  await page.locator("#file-input").setInputFiles({
    name: "bad.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.locator("#message")).toContainText(
    "damaged or unsupported",
  );
  await expect(page.locator("#file-name")).toHaveText("still-life.png");
  await page.getByLabel("Keep original proportions").uncheck();
  await page.locator("#width").fill("4000");
  await page.locator("#height").fill("3001");
  await page.locator("#download").click();
  await expect(page.locator("#message")).toContainText("12 megapixels");
  await expect(page.locator("#output-detail")).toHaveText(
    "Output: 1,600 × 1,200 px",
  );
  await page.locator("#width").fill("400");
  await page.locator("#height").fill("300");
  await download(page, "image/png", 400, 300);
});

test("image operations make no external requests and layout works on mobile", async ({
  page,
}, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      /^https?:/.test(request.url()) &&
      !request.url().startsWith("http://127.0.0.1:4173/")
    )
      requests.push(request.url());
  });
  await loadSample(page);
  if (process.env.CAPTURE_SCREENSHOTS && testInfo.project.name === "chromium") {
    await mkdir("docs/images", { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1180 });
    await page.screenshot({
      path: "docs/images/screenshot.png",
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#preview")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Crop", exact: true }).click();
  await page.getByRole("button", { name: "9:16", exact: true }).click();
  await page.getByRole("button", { name: "Apply crop" }).click();
  await download(page, "image/png", 675, 1200);
  if (process.env.CAPTURE_SCREENSHOTS && testInfo.project.name === "chromium")
    await page.screenshot({ path: "docs/images/mobile.png", fullPage: true });
  expect(requests).toEqual([]);
});

test("drag and drop accepts local image files", async ({ page }) => {
  await page.goto("/");
  const bytes = await readFile("public/examples/still-life.png");
  const transfer = await page.evaluateHandle((base64) => {
    const data = new DataTransfer();
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    data.items.add(new File([bytes], "dropped.png", { type: "image/png" }));
    return data;
  }, bytes.toString("base64"));
  await page
    .locator("#drop-zone")
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.locator("#file-name")).toHaveText("dropped.png");
  await expect(
    page.getByRole("button", { name: "Download PNG" }),
  ).toBeEnabled();
});

for (const fallback of [false, true])
  test(`JPEG EXIF orientation is applied once (${fallback ? "image element fallback" : "bitmap decoder"})`, async ({
    page,
  }) => {
    if (fallback)
      await page.addInitScript(() => {
        Object.defineProperty(window, "createImageBitmap", {
          value: undefined,
          configurable: true,
        });
      });
    await page.goto("/");
    const bytes = await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 32;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 0, 24, 32);
      ctx.fillStyle = "#0000ff";
      ctx.fillRect(24, 0, 24, 32);
      const jpeg = await new Promise<Blob>((resolve) =>
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 1),
      );
      const source = new Uint8Array(await jpeg.arrayBuffer());
      const exif = new Uint8Array([
        255, 225, 0, 34, 69, 120, 105, 102, 0, 0, 73, 73, 42, 0, 8, 0, 0, 0, 1,
        0, 18, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
      ]);
      const oriented = new Uint8Array(source.length + exif.length);
      oriented.set(source.subarray(0, 2));
      oriented.set(exif, 2);
      oriented.set(source.subarray(2), exif.length + 2);
      return [...oriented];
    });
    await page.locator("#file-input").setInputFiles({
      name: "phone.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from(bytes),
    });
    await expect(page.locator("#file-detail")).toContainText("32 × 48 px");
    const pixels = await page
      .locator("#preview")
      .evaluate((canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext("2d")!;
        return [
          Array.from(ctx.getImageData(16, 8, 1, 1).data),
          Array.from(ctx.getImageData(16, 40, 1, 1).data),
        ];
      });
    expect(pixels[0][0]).toBeGreaterThan(240);
    expect(pixels[1][2]).toBeGreaterThan(240);
    await download(page, "image/png", 32, 48);
  });

test("exported WebP opens again by signature even with a misleading filename", async ({
  page,
}) => {
  await loadSample(page);
  test.skip(
    await page.locator('option[value="image/webp"]').isDisabled(),
    "Browser does not provide a WebP encoder.",
  );
  await page.locator("#width").fill("320");
  const { bytes } = await download(page, "image/webp", 320, 240);
  await page.locator("#file-input").setInputFiles({
    name: "actually-webp.txt",
    mimeType: "text/plain",
    buffer: bytes,
  });
  await expect(page.locator("#file-name")).toHaveText("actually-webp.txt");
  await expect(page.locator("#file-detail")).toContainText("320 × 240 px");
  await expect(page.locator("#file-detail")).toContainText("WEBP");
});

test("crop dragging stays inside the image without changing its size", async ({
  page,
}) => {
  await loadSample(page);
  await page.getByRole("button", { name: "Crop", exact: true }).click();
  await page.getByRole("button", { name: "1:1", exact: true }).click();
  const frame = await page.locator("#crop-selection").boundingBox();
  await page.mouse.move(
    frame!.x + frame!.width / 2,
    frame!.y + frame!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    frame!.x + frame!.width + 500,
    frame!.y + frame!.height / 2,
    { steps: 3 },
  );
  await page.mouse.up();
  await expect(page.locator("#crop-x")).toHaveValue("400");
  await expect(page.locator("#crop-width")).toHaveValue("1200");
  await page.getByRole("button", { name: "Apply crop" }).click();
  await download(page, "image/png", 1200, 1200);
});

test("a slow sample request cannot replace a more recently dropped image", async ({
  page,
}) => {
  await page.goto("/");
  let release!: () => void;
  let requested!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route("**/examples/still-life.png", async (route) => {
    requested();
    await waiting;
    await route.fulfill({
      path: "public/examples/still-life.png",
      contentType: "image/png",
    });
  });
  await page.getByRole("button", { name: "Try the sample image" }).click();
  await started;
  const bytes = await readFile("public/examples/still-life.png");
  const transfer = await page.evaluateHandle((base64) => {
    const data = new DataTransfer();
    data.items.add(
      new File(
        [Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))],
        "newest.png",
        { type: "image/png" },
      ),
    );
    return data;
  }, bytes.toString("base64"));
  await page
    .locator("#drop-zone")
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.locator("#file-name")).toHaveText("newest.png");
  const response = page.waitForResponse("**/examples/still-life.png");
  release();
  await (await response).finished();
  // Give any stale decoder time to settle before checking the negative outcome.
  await page.waitForTimeout(250);
  await expect(page.locator("#file-name")).toHaveText("newest.png");
  await expect(
    page.getByRole("button", { name: "Download PNG" }),
  ).toBeEnabled();
});
