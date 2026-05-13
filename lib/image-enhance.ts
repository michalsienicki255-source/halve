/**
 * Client-side image enhancement to boost OCR accuracy.
 * - Downscale to a target long edge
 * - Convert towards grayscale with high contrast
 * - Light sharpening via 3x3 convolution
 *
 * Pure browser canvas APIs, no external deps.
 */

export type EnhanceOptions = {
  targetLongEdge?: number;
  contrast?: number; // 0..2, 1 = no change
  brightness?: number; // -50..50, 0 = no change
  saturation?: number; // 0..1, 0 = grayscale, 1 = original
  sharpen?: boolean;
  jpegQuality?: number; // 0..1
};

const DEFAULTS: Required<EnhanceOptions> = {
  targetLongEdge: 1600,
  contrast: 1.35,
  brightness: 8,
  saturation: 0.45,
  sharpen: true,
  jpegQuality: 0.9,
};

export async function enhanceReceiptImage(
  file: File | Blob | string,
  opts: EnhanceOptions = {}
): Promise<string> {
  const o = { ...DEFAULTS, ...opts };

  const dataUrl =
    typeof file === "string" ? file : await blobToDataUrl(file);
  const img = await loadImage(dataUrl);

  const { width, height } = img;
  const longEdge = Math.max(width, height);
  const scale = longEdge > o.targetLongEdge ? o.targetLongEdge / longEdge : 1;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  applyAdjustments(imageData, o);
  ctx.putImageData(imageData, 0, 0);

  if (o.sharpen) {
    applyConvolution(ctx, w, h, [
      0, -0.5, 0,
      -0.5, 3, -0.5,
      0, -0.5, 0,
    ]);
  }

  return canvas.toDataURL("image/jpeg", o.jpegQuality);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = src;
  });
}

function applyAdjustments(
  imageData: ImageData,
  o: Required<EnhanceOptions>
) {
  const { contrast, brightness, saturation } = o;
  const data = imageData.data;
  const c = 259 * (contrast * 255 + 255) / (255 * (259 - contrast * 255));
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = lum + (r - lum) * saturation;
    g = lum + (g - lum) * saturation;
    b = lum + (b - lum) * saturation;

    r = c * (r - 128) + 128 + brightness;
    g = c * (g - 128) + 128 + brightness;
    b = c * (b - 128) + 128 + brightness;

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }
}

function applyConvolution(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  kernel: number[]
) {
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  const sd = src.data;
  const dd = dst.data;
  const kSize = Math.sqrt(kernel.length);
  const half = Math.floor(kSize / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const px = Math.min(w - 1, Math.max(0, x + kx - half));
          const py = Math.min(h - 1, Math.max(0, y + ky - half));
          const idx = (py * w + px) * 4;
          const weight = kernel[ky * kSize + kx];
          r += sd[idx] * weight;
          g += sd[idx + 1] * weight;
          b += sd[idx + 2] * weight;
        }
      }
      const dIdx = (y * w + x) * 4;
      dd[dIdx] = clamp(r);
      dd[dIdx + 1] = clamp(g);
      dd[dIdx + 2] = clamp(b);
      dd[dIdx + 3] = sd[dIdx + 3];
    }
  }
  ctx.putImageData(dst, 0, 0);
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
