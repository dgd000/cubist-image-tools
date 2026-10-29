import "./style.css";
import { decodeAsset, releaseAssetSource } from "./lib/decode";
import {
  aspectCrop,
  clampCrop,
  cropEdit,
  initialEdit,
  validateSize,
} from "./lib/geometry";
import {
  exportFilename,
  exportImage,
  renderImage,
  supportedExportFormats,
} from "./lib/export";
import { LIMITS } from "./lib/limits";
import type { Edit, ImageAsset, ImageMime, Rect } from "./lib/types";

const brandUrl =
  "https://cubistai.app/?utm_source=github&utm_medium=referral&utm_campaign=cubist-image-tools";
const githubUrl = "https://github.com/dgd000/cubist-image-tools";
const icons = {
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  download: '<path d="M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  resize:
    '<path d="M8 3H3v5m13 13h5v-5M3 3l7 7m11 11-7-7M16 3h5v5M8 21H3v-5"/>',
  crop: '<path d="M6 3v15h15M3 6h15v15"/>',
  undo: '<path d="M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12"/>',
  redo: '<path d="m15 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
};
function icon(name: keyof typeof icons) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <a class="skip-link" href="#workspace">Skip to image tools</a>
  <header class="site-header">
    <a class="wordmark" href="./" aria-label="Cubist Image Tools home"><img src="./favicon.svg" alt="" width="32" height="32" /><span>cubist<span class="wordmark-light"> / image tools</span></span></a>
    <nav aria-label="Main navigation"><span class="version">OPEN SOURCE · v0.1.0</span><a href="${githubUrl}" target="_blank" rel="noopener noreferrer">View on GitHub ${icon("external")}</a></nav>
  </header>
  <main>
    <section class="intro" aria-labelledby="page-title">
      <div><p class="eyebrow"><span></span> THE EVERYDAY IMAGE STUDIO</p><h1 id="page-title">Big ideas.<br /><em>Perfect dimensions.</em></h1><p class="intro-copy">Resize, crop, convert. A few small tools to get your images<br class="desktop-break" /> ready for wherever they’re going.</p></div>
      <div class="intro-note"><div class="local-badge">${icon("lock")} Stays on your device</div><p>No uploads. No accounts.<br />Just you and your next good image.</p><span class="tiny-mark" aria-hidden="true">↙</span></div>
    </section>
    <section id="workspace" class="workspace" aria-label="Image editor" tabindex="-1">
      <div class="editor-bar"><div class="file-meta"><span class="file-dot"></span><div><strong id="file-name">Your canvas is ready</strong><span id="file-detail">PNG, JPEG or static WebP · up to 20 MiB</span></div></div><div class="bar-actions"><button id="undo" class="icon-button" aria-label="Undo" title="Undo (Ctrl/⌘ Z)" disabled>${icon("undo")}</button><button id="redo" class="icon-button" aria-label="Redo" title="Redo (Ctrl/⌘ Shift Z)" disabled>${icon("redo")}</button><span class="divider"></span><button id="reset" class="text-button" disabled>Reset</button><button id="open-file" class="button button-small">${icon("upload")} Open image</button></div></div>
      <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" hidden />
      <div class="editor-body">
        <div class="canvas-column" id="drop-zone">
          <div class="canvas-topline"><span>WORKSPACE <span class="subtle">/</span> <span id="preview-mode">PREVIEW</span></span><span id="preview-scale">FIT TO VIEW</span></div>
          <div class="stage" id="stage">
            <div class="empty-state" id="empty-state"><div class="empty-art" aria-hidden="true"><span></span><span></span><span></span></div><h2>A little room to create.</h2><p>Drop an image here to get started.</p><button class="button button-dark" id="choose-image">Choose an image ${icon("arrow")}</button><span class="empty-or">or start with something of ours</span><button id="sample" class="sample-button"><img src="./examples/still-life.png" alt="" width="40" height="32" />Try the sample image <span>↗</span></button></div>
            <div class="image-frame" id="image-frame" hidden><canvas id="preview" aria-label="Edited image preview"></canvas><div id="crop-selection" class="crop-selection" tabindex="0" role="group" aria-label="Crop area. Drag to move, or use arrow keys. Shift moves ten pixels." hidden><i></i><i></i><i></i><i></i><span class="crop-grid"></span><span class="crop-label" id="crop-label"></span></div></div>
          </div>
          <div class="canvas-bottomline"><span><span class="green-dot"></span> Processed in your browser</span><span id="output-detail">Your original file stays untouched</span></div>
        </div>
        <aside class="inspector" aria-label="Editing controls">
          <div class="tool-switch" aria-label="Choose editing tool"><button id="resize-tool" aria-pressed="true">${icon("resize")} Resize</button><button id="crop-tool" aria-pressed="false">${icon("crop")} Crop</button></div>
          <fieldset id="edit-controls" disabled><legend class="sr-only">Image adjustments</legend>
            <form id="resize-form"><div class="section-heading"><h2>Make it fit.</h2><span>01 / SIZE</span></div><p class="control-copy">The right dimensions for your next destination.</p><div class="dimensions"><label>Width <span>px</span><input id="width" type="number" min="1" max="8192" step="1" required placeholder="—" /></label><span class="dimension-times">×</span><label>Height <span>px</span><input id="height" type="number" min="1" max="8192" step="1" required placeholder="—" /></label></div><label class="checkbox-label"><input id="keep-ratio" type="checkbox" checked /> Keep original proportions</label><div class="size-presets" aria-label="Resize by percentage"><button type="button" data-scale="0.25">25%</button><button type="button" data-scale="0.5">50%</button><button type="button" data-scale="0.75">75%</button><button type="button" data-scale="1">100%</button></div><button class="button button-outline full" type="submit">Apply size ${icon("arrow")}</button></form>
            <div id="crop-panel" hidden><div class="section-heading"><h2>Find your frame.</h2><span>01 / CROP</span></div><p class="control-copy">Pick a ratio. Move the frame to make it yours.</p><div class="aspect-presets" aria-label="Crop aspect ratio"><button data-aspect="original" aria-pressed="true">Original</button><button data-aspect="1">1:1</button><button data-aspect="1.3333333333333333">4:3</button><button data-aspect="1.5">3:2</button><button data-aspect="1.7777777777777777">16:9</button><button data-aspect="0.5625">9:16</button><button data-aspect="custom">Custom</button></div><div class="crop-fields"><label>X <input id="crop-x" type="number" min="0" step="1" /></label><label>Y <input id="crop-y" type="number" min="0" step="1" /></label><label>Width <input id="crop-width" type="number" min="1" step="1" /></label><label>Height <input id="crop-height" type="number" min="1" step="1" /></label></div><p class="crop-hint">Drag the frame or use arrow keys. Custom unlocks crop dimensions.</p><button id="apply-crop" class="button button-outline full">Apply crop ${icon("arrow")}</button></div>
          </fieldset>
          <fieldset id="export-controls" disabled><legend class="sr-only">Export settings</legend><div class="section-heading export-heading"><h2>Ready to go.</h2><span>02 / EXPORT</span></div><label class="field-label" for="format">File format</label><div class="select-wrap"><select id="format" aria-describedby="format-note"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select><span>⌄</span></div><p class="format-note" id="format-note">Keeps transparency. A good all-rounder.</p><label class="background-label" id="background-label" hidden>JPEG background <input id="background" type="color" value="#ffffff" /></label><button id="download" class="button button-dark full">${icon("download")} <span id="download-label">Download image</span></button><p class="export-footnote">One image. Exactly how you need it.</p></fieldset>
        </aside>
      </div>
      <p id="message" class="message" role="status" aria-live="polite" hidden></p>
    </section>
    <section class="under-editor" aria-label="About these tools"><div><span class="feature-number">01</span><p><strong>Small tools. Real possibilities.</strong><br />From a profile picture to your next big launch.</p></div><div><span class="feature-number">02</span><p><strong>Your images stay yours.</strong><br />Local editing, from the first pixel to the last.</p></div><a href="${githubUrl}" target="_blank" rel="noopener noreferrer"><span class="feature-number">03</span><p><strong>Open by design. ${icon("external")}</strong><br />MIT licensed. Make something of your own.</p></a></section>
  </main>
  <footer><span>A small studio by <a href="${brandUrl}" target="_blank" rel="noopener noreferrer">CubistAI ↗</a></span><span>Made for the everyday creative.<span class="footer-flower" aria-hidden="true">✳</span></span></footer>
`;

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}
const widthInput = el<HTMLInputElement>("width"),
  heightInput = el<HTMLInputElement>("height");
const canvas = el<HTMLCanvasElement>("preview");
const selection = el("crop-selection");
let asset: ImageAsset | null = null;
let history: Edit[] = [];
let cursor = 0;
let tool: "resize" | "crop" = "resize";
let crop: Rect = { x: 0, y: 0, width: 1, height: 1 };
let cropAspect = "original";
let loading = false,
  exporting = false,
  loadId = 0;
let formats: ImageMime[] = [];
const objectUrls = new Set<string>();
const timers = new Set<ReturnType<typeof setTimeout>>();
const current = () => history[cursor];
const humanBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KiB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MiB`;

function message(text = "", error = false) {
  const node = el("message");
  node.hidden = !text;
  node.textContent = text;
  node.classList.toggle("is-error", error);
}
function report(error: unknown) {
  message(
    error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.",
    true,
  );
}
function syncBusy() {
  const busy = loading || exporting;
  el<HTMLFieldSetElement>("edit-controls").disabled = !asset || busy;
  el<HTMLFieldSetElement>("export-controls").disabled =
    !asset || busy || !formats.length;
  for (const id of ["open-file", "choose-image", "sample"])
    el<HTMLButtonElement>(id).disabled = busy;
  el<HTMLButtonElement>("reset").disabled = !asset || busy;
  el<HTMLButtonElement>("undo").disabled = !asset || cursor === 0 || busy;
  el<HTMLButtonElement>("redo").disabled =
    !asset || cursor === history.length - 1 || busy;
  el("workspace").setAttribute("aria-busy", String(busy));
}
function fitFrame() {
  if (!asset) return;
  const size = current().size,
    stage = el("stage");
  const scale = Math.min(
    (stage.clientWidth - 64) / size.width,
    (stage.clientHeight - 56) / size.height,
    1,
  );
  el("image-frame").style.width = `${Math.max(1, size.width * scale)}px`;
  el("image-frame").style.height = `${Math.max(1, size.height * scale)}px`;
  el("preview-scale").textContent = `${Math.round(scale * 100)}% · FIT TO VIEW`;
}
function syncCrop() {
  if (!asset) return;
  const size = current().size;
  selection.style.left = `${(crop.x / size.width) * 100}%`;
  selection.style.top = `${(crop.y / size.height) * 100}%`;
  selection.style.width = `${(crop.width / size.width) * 100}%`;
  selection.style.height = `${(crop.height / size.height) * 100}%`;
  el("crop-label").textContent = `${crop.width} × ${crop.height}`;
  for (const key of ["x", "y", "width", "height"] as const)
    el<HTMLInputElement>(`crop-${key}`).value = String(crop[key]);
  for (const key of ["width", "height"])
    el<HTMLInputElement>(`crop-${key}`).readOnly = cropAspect !== "custom";
  document
    .querySelectorAll<HTMLButtonElement>("[data-aspect]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.aspect === cropAspect),
      ),
    );
}
function resetCrop() {
  if (!asset) return;
  const size = current().size;
  crop =
    cropAspect === "custom" || cropAspect === "original"
      ? { x: 0, y: 0, ...size }
      : aspectCrop(size, Number(cropAspect));
  syncCrop();
}
function render() {
  if (!asset) return;
  renderImage(canvas, asset, current(), true);
  widthInput.value = String(current().size.width);
  heightInput.value = String(current().size.height);
  el("output-detail").textContent =
    `Output: ${current().size.width.toLocaleString()} × ${current().size.height.toLocaleString()} px`;
  el("empty-state").hidden = true;
  el("image-frame").hidden = false;
  selection.hidden = tool !== "crop";
  resetCrop();
  fitFrame();
  syncBusy();
}
function commit(edit: Edit) {
  validateSize(edit.size.width, edit.size.height);
  if (JSON.stringify(edit) === JSON.stringify(current())) return;
  history = [...history.slice(0, cursor + 1), edit].slice(-LIMITS.history - 1);
  cursor = history.length - 1;
  render();
}
async function openImage(input: Blob | Promise<Blob>, name: string) {
  const id = ++loadId;
  loading = true;
  syncBusy();
  message("Opening image…");
  try {
    const blob = await input;
    if (id !== loadId) return;
    const next = await decodeAsset(blob, name);
    if (id !== loadId) {
      releaseAssetSource(next.source);
      return;
    }
    if (asset) releaseAssetSource(asset.source);
    asset = next;
    history = [initialEdit(next)];
    cursor = 0;
    cropAspect = "original";
    el("file-name").textContent = name;
    el("file-detail").textContent =
      `${next.width.toLocaleString()} × ${next.height.toLocaleString()} px · ${humanBytes(blob.size)} · ${next.mimeType.split("/")[1].toUpperCase()}`;
    render();
    message("Image ready. Make it your own.");
  } catch (error) {
    if (id === loadId) report(error);
  } finally {
    if (id === loadId) {
      loading = false;
      syncBusy();
    }
  }
}
function openFiles(files: FileList | File[]) {
  if (exporting) return;
  if (files.length !== 1) {
    message("Choose one image at a time.", true);
    return;
  }
  void openImage(files[0], files[0].name);
}
for (const id of ["open-file", "choose-image"])
  el(id).addEventListener("click", () =>
    el<HTMLInputElement>("file-input").click(),
  );
el<HTMLInputElement>("file-input").addEventListener("change", (event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) openFiles(input.files);
  input.value = "";
});
el("sample").addEventListener("click", () => {
  const sample = fetch(
    `${import.meta.env.BASE_URL}examples/still-life.png`,
  ).then((response) => {
    if (!response.ok)
      throw new Error(
        "The sample could not be loaded. Try opening your own image.",
      );
    return response.blob();
  });
  void openImage(sample, "still-life.png");
});
for (const eventName of ["dragover", "drop"])
  window.addEventListener(eventName, (event) => event.preventDefault());
let dragDepth = 0;
const zone = el("drop-zone");
zone.addEventListener("dragenter", () => {
  dragDepth++;
  zone.classList.add("is-dragging");
});
zone.addEventListener("dragleave", () => {
  if (--dragDepth <= 0) zone.classList.remove("is-dragging");
});
zone.addEventListener("drop", (event) => {
  dragDepth = 0;
  zone.classList.remove("is-dragging");
  if (event.dataTransfer?.files.length) openFiles(event.dataTransfer.files);
});
function switchTool(next: typeof tool) {
  tool = next;
  el("resize-form").hidden = tool !== "resize";
  el("crop-panel").hidden = tool !== "crop";
  el("resize-tool").setAttribute("aria-pressed", String(tool === "resize"));
  el("crop-tool").setAttribute("aria-pressed", String(tool === "crop"));
  el("preview-mode").textContent = tool === "crop" ? "CROP" : "PREVIEW";
  selection.hidden = !asset || tool !== "crop";
  if (asset) resetCrop();
}
el("resize-tool").addEventListener("click", () => switchTool("resize"));
el("crop-tool").addEventListener("click", () => switchTool("crop"));
function applyResize() {
  if (!asset) return;
  const size = validateSize(
    widthInput.valueAsNumber,
    heightInput.valueAsNumber,
  );
  commit({ ...current(), size });
}
el("resize-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    applyResize();
    message("Size applied. Export whenever you’re ready.");
  } catch (error) {
    report(error);
  }
});
for (const [input, other, width] of [
  [widthInput, heightInput, true],
  [heightInput, widthInput, false],
] as const) {
  input.addEventListener("input", () => {
    if (
      !asset ||
      !el<HTMLInputElement>("keep-ratio").checked ||
      !Number.isFinite(input.valueAsNumber)
    )
      return;
    const size = current().size,
      ratio = size.width / size.height;
    other.value = String(
      Math.max(
        1,
        Math.round(
          width ? input.valueAsNumber / ratio : input.valueAsNumber * ratio,
        ),
      ),
    );
  });
}
document.querySelectorAll<HTMLButtonElement>("[data-scale]").forEach((button) =>
  button.addEventListener("click", () => {
    if (!asset) return;
    const scale = Number(button.dataset.scale);
    // Percentages refer to the current crop at its original source resolution.
    widthInput.value = String(
      Math.max(1, Math.round(current().crop.width * scale)),
    );
    heightInput.value = String(
      Math.max(1, Math.round(current().crop.height * scale)),
    );
  }),
);
document
  .querySelectorAll<HTMLButtonElement>("[data-aspect]")
  .forEach((button) =>
    button.addEventListener("click", () => {
      cropAspect = button.dataset.aspect!;
      resetCrop();
    }),
  );
for (const key of ["x", "y", "width", "height"] as const)
  el(`crop-${key}`).addEventListener("change", () => {
    if (!asset) return;
    const value = el<HTMLInputElement>(`crop-${key}`).valueAsNumber;
    if (
      !Number.isInteger(value) ||
      value < (key === "x" || key === "y" ? 0 : 1)
    ) {
      message("Enter valid whole pixel crop dimensions.", true);
      syncCrop();
      return;
    }
    if (key === "x" || key === "y") {
      crop = {
        ...crop,
        [key]: Math.min(
          value,
          current().size[key === "x" ? "width" : "height"] -
            crop[key === "x" ? "width" : "height"],
        ),
      };
    } else crop = clampCrop({ ...crop, [key]: value }, current().size);
    syncCrop();
    message();
  });
el("apply-crop").addEventListener("click", () => {
  if (!asset) return;
  try {
    commit(cropEdit(current(), crop));
    message("Crop applied. You can undo it at any time.");
  } catch (error) {
    report(error);
  }
});
let drag: { id: number; x: number; y: number; crop: Rect } | null = null;
selection.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0 || loading || exporting) return;
  event.preventDefault();
  selection.focus();
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    crop: { ...crop },
  };
  selection.setPointerCapture(event.pointerId);
});
function moveCrop(x: number, y: number) {
  if (!asset) return;
  crop = {
    ...crop,
    x: Math.max(0, Math.min(current().size.width - crop.width, Math.round(x))),
    y: Math.max(
      0,
      Math.min(current().size.height - crop.height, Math.round(y)),
    ),
  };
  syncCrop();
}
selection.addEventListener("pointermove", (event) => {
  if (!drag || !asset || event.pointerId !== drag.id) return;
  const bounds = el("image-frame").getBoundingClientRect();
  moveCrop(
    drag.crop.x +
      ((event.clientX - drag.x) * current().size.width) / bounds.width,
    drag.crop.y +
      ((event.clientY - drag.y) * current().size.height) / bounds.height,
  );
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  selection.addEventListener(name, () => {
    drag = null;
  });
selection.addEventListener("keydown", (event) => {
  const step = event.shiftKey ? 10 : 1;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key))
    return;
  event.preventDefault();
  moveCrop(
    crop.x +
      (event.key === "ArrowLeft"
        ? -step
        : event.key === "ArrowRight"
          ? step
          : 0),
    crop.y +
      (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0),
  );
});
function undoRedo(offset: number) {
  if (
    !asset ||
    loading ||
    exporting ||
    cursor + offset < 0 ||
    cursor + offset >= history.length
  )
    return;
  cursor += offset;
  render();
  message(offset < 0 ? "Edit undone." : "Edit restored.");
}
el("undo").addEventListener("click", () => undoRedo(-1));
el("redo").addEventListener("click", () => undoRedo(1));
el("reset").addEventListener("click", () => {
  if (asset) {
    commit(initialEdit(asset));
    message("Back to the original.");
  }
});
window.addEventListener("keydown", (event) => {
  if (
    event.target instanceof HTMLElement &&
    event.target.closest('input, select, textarea, [contenteditable="true"]')
  )
    return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undoRedo(event.shiftKey ? 1 : -1);
  }
});
function syncFormat() {
  const mime = el<HTMLSelectElement>("format").value as ImageMime;
  el("format-note").textContent =
    mime === "image/png"
      ? "Keeps transparency. A good all-rounder."
      : mime === "image/jpeg"
        ? "Smaller, lossy images. Transparency gets a background."
        : "Modern, lossy images with transparency support.";
  el("background-label").hidden = mime !== "image/jpeg";
  el("download-label").textContent =
    `Download ${mime.split("/")[1].toUpperCase()}`;
}
el("format").addEventListener("change", syncFormat);
el("download").addEventListener("click", async () => {
  if (!asset || loading || exporting) return;
  try {
    if (tool === "resize") applyResize();
    exporting = true;
    syncBusy();
    el("download-label").textContent = "Preparing…";
    message("Preparing your image…");
    const mime = el<HTMLSelectElement>("format").value as ImageMime;
    const blob = await exportImage(
      asset,
      current(),
      mime,
      el<HTMLInputElement>("background").value,
    );
    const url = URL.createObjectURL(blob);
    objectUrls.add(url);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFilename(asset.name, mime);
    document.body.append(link);
    link.click();
    link.remove();
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      objectUrls.delete(url);
      timers.delete(timer);
    }, 60_000);
    timers.add(timer);
    message(
      `Download ready · ${current().size.width} × ${current().size.height} px · ${humanBytes(blob.size)}. Your original is unchanged.`,
    );
  } catch (error) {
    report(error);
  } finally {
    exporting = false;
    syncBusy();
    syncFormat();
  }
});
new ResizeObserver(fitFrame).observe(el("stage"));
void supportedExportFormats()
  .then((supported) => {
    formats = supported;
    for (const option of el<HTMLSelectElement>("format").options)
      option.disabled = !formats.includes(option.value as ImageMime);
    if (formats.length) el<HTMLSelectElement>("format").value = formats[0];
    else
      message(
        "This browser has no supported image encoder. Try another browser.",
        true,
      );
    syncFormat();
    syncBusy();
  })
  .catch(report);
window.addEventListener("pagehide", () => {
  for (const url of objectUrls) URL.revokeObjectURL(url);
  for (const timer of timers) clearTimeout(timer);
});
