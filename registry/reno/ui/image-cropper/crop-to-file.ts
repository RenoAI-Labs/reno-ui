import { outputSize, type CropRect } from "./crop-geometry";

/**
 * Draws a crop rectangle onto a canvas and hands back a `File`.
 *
 * The whole reason this exists in the browser: the projects consuming reno-ui
 * upload straight to object storage with a presigned PUT, so nothing on the
 * server ever decodes the image. Whatever the user drops is what gets stored,
 * unless the crop happens here.
 *
 * Exported on its own, not just called by the component, so a project that
 * wants its own confirm button — inside a dialog footer, a wizard step, a form
 * submit — can produce the same file without rebuilding the crop surface.
 */

export type CropOutputOptions = {
  /** Cap on the exported bitmap. Downscales only; never enlarges a small crop. */
  maxWidth?: number;
  maxHeight?: number;
  /** Any type the browser's canvas can encode: image/jpeg, image/png, image/webp. */
  type?: string;
  /** 0-1, honoured by the lossy encoders only. */
  quality?: number;
  fileName?: string;
};

/**
 * JPEG rather than PNG: the output feeds an upload, and a photograph re-encoded
 * as PNG is several times the bytes for no visible gain. A caller that needs
 * transparency passes `type: "image/png"`.
 */
const DEFAULT_TYPE = "image/jpeg";
const DEFAULT_QUALITY = 0.9;

/** Extension matching the encoded type, so the stored object is not mislabelled. */
function extensionFor(type: string): string {
  const subtype = type.split("/")[1] ?? "jpeg";
  return subtype === "jpeg" ? "jpg" : subtype;
}

export async function cropImageToFile(
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  crop: CropRect,
  options: CropOutputOptions = {},
): Promise<File> {
  const { maxWidth, maxHeight, type = DEFAULT_TYPE, quality = DEFAULT_QUALITY } = options;
  const size = outputSize(crop, maxWidth, maxHeight);

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Trình duyệt không tạo được canvas 2d để cắt ảnh.");
  }

  // Browsers pick a fast nearest-neighbour path by default when downscaling in
  // one step, which is exactly what a crop-then-resize does. The result is
  // visibly aliased on text and thin lines.
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size.width,
    size.height,
  );

  const blob = await new Promise<Blob | null>((resolve, reject) => {
    try {
      canvas.toBlob(resolve, type, quality);
    } catch (error) {
      // A canvas fed a cross-origin image without CORS headers is tainted, and
      // only the export throws — loading and cropping both looked fine. Say so,
      // because the default message names neither the image nor the cause.
      reject(
        new Error(
          "Không xuất được ảnh: canvas đã bị nhiễm bởi ảnh khác origin. Ảnh cần header CORS hoặc phải được đọc từ tệp local.",
          { cause: error },
        ),
      );
    }
  });

  if (!blob) {
    throw new Error(`Trình duyệt không mã hoá được ảnh sang ${type}.`);
  }

  const fileName = options.fileName ?? `crop-${Date.now()}.${extensionFor(type)}`;
  return new File([blob], fileName, { type: blob.type || type });
}
