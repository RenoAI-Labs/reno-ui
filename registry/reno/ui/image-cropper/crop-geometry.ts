/**
 * Crop rectangle maths, kept free of the DOM.
 *
 * The rectangle lives in the image's own pixel space, never in screen pixels.
 * That is the whole point of the split: the crop surface is fluid, so its on
 * screen size changes with the viewport, and a rectangle stored in screen
 * pixels would silently drift every time the container resized. Natural pixels
 * are also what the export canvas needs, so nothing has to be converted twice.
 *
 * Pure functions here, a React component there — the geometry is the part with
 * edge cases worth testing on its own.
 */

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Bounds of the image the rectangle must stay inside, in natural pixels. */
export type CropBounds = {
  width: number;
  height: number;
};

/** The four grab points. `nw` is top-left, matching CSS resize cursors. */
export type CropCorner = "nw" | "ne" | "sw" | "se";

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * The largest rectangle of `aspect` that fits in the image, scaled to
 * `coverage` and centred.
 *
 * Starting from a full-bleed selection would be useless — the user would have
 * to drag every edge inwards before anything is cropped — and starting from a
 * small one hides how much of the picture is kept. Most of the frame, centred,
 * is the selection a user is most likely to accept unchanged.
 */
export function centeredCrop(
  bounds: CropBounds,
  aspect?: number,
  coverage = 0.9,
): CropRect {
  let width = bounds.width;
  let height = bounds.height;

  if (aspect && aspect > 0) {
    width = Math.min(bounds.width, bounds.height * aspect);
    height = width / aspect;
  }

  width = Math.round(width * coverage);
  height = Math.round(height * coverage);

  return {
    x: Math.round((bounds.width - width) / 2),
    y: Math.round((bounds.height - height) / 2),
    width,
    height,
  };
}

/** Pull a rectangle back inside the image without changing its shape if it fits. */
export function clampCrop(crop: CropRect, bounds: CropBounds, minSize = 1): CropRect {
  const width = clamp(crop.width, Math.min(minSize, bounds.width), bounds.width);
  const height = clamp(crop.height, Math.min(minSize, bounds.height), bounds.height);
  return {
    width,
    height,
    x: clamp(crop.x, 0, bounds.width - width),
    y: clamp(crop.y, 0, bounds.height - height),
  };
}

/** Translate the selection, stopping at the image edge rather than shrinking it. */
export function moveCrop(
  crop: CropRect,
  dx: number,
  dy: number,
  bounds: CropBounds,
): CropRect {
  return {
    ...crop,
    x: clamp(Math.round(crop.x + dx), 0, Math.max(0, bounds.width - crop.width)),
    y: clamp(Math.round(crop.y + dy), 0, Math.max(0, bounds.height - crop.height)),
  };
}

/**
 * Drag one corner; the opposite corner stays put.
 *
 * Two rules make this behave the way a user expects rather than the way the
 * arithmetic falls out. A corner never crosses its anchor, so the rectangle
 * cannot invert mid-drag and leave the handles mirrored. And under an aspect
 * lock the free dimension is derived, then re-derived from the other one if the
 * first answer would leave the image — dragging into a corner then stops at the
 * edge instead of quietly breaking the ratio the caller asked to lock.
 */
export function resizeCropCorner(
  crop: CropRect,
  corner: CropCorner,
  dx: number,
  dy: number,
  bounds: CropBounds,
  minSize: number,
  aspect?: number,
): CropRect {
  const west = corner === "nw" || corner === "sw";
  const north = corner === "nw" || corner === "ne";

  const anchorX = west ? crop.x + crop.width : crop.x;
  const anchorY = north ? crop.y + crop.height : crop.y;

  // Room between the anchor and the image edge, in the direction being dragged.
  const availableX = west ? anchorX : bounds.width - anchorX;
  const availableY = north ? anchorY : bounds.height - anchorY;

  const pointerX = (west ? crop.x : crop.x + crop.width) + dx;
  const pointerY = (north ? crop.y : crop.y + crop.height) + dy;

  let width = clamp(west ? anchorX - pointerX : pointerX - anchorX, 0, availableX);
  let height = clamp(north ? anchorY - pointerY : pointerY - anchorY, 0, availableY);

  if (aspect && aspect > 0) {
    height = width / aspect;
    if (height > availableY) {
      height = availableY;
      width = height * aspect;
    }
    if (width < minSize) {
      width = minSize;
      height = width / aspect;
    }
    if (height < minSize) {
      height = minSize;
      width = height * aspect;
    }
    // A minimum the image itself cannot honour: keep the ratio, lose the minimum.
    if (width > availableX || height > availableY) {
      width = Math.min(availableX, availableY * aspect);
      height = width / aspect;
    }
  } else {
    width = clamp(width, Math.min(minSize, availableX), availableX);
    height = clamp(height, Math.min(minSize, availableY), availableY);
  }

  width = Math.round(width);
  height = Math.round(height);

  return clampCrop(
    {
      width,
      height,
      x: west ? anchorX - width : anchorX,
      y: north ? anchorY - height : anchorY,
    },
    bounds,
    1,
  );
}

/**
 * How big the exported bitmap should be.
 *
 * Downscale only. A crop enlarged to hit `maxWidth` would upload a blurred
 * bigger file than the one the user chose, which is the opposite of what a max
 * dimension is asked for.
 */
export function outputSize(
  crop: CropRect,
  maxWidth?: number,
  maxHeight?: number,
): { width: number; height: number } {
  const scales = [1];
  if (maxWidth && crop.width > 0) scales.push(maxWidth / crop.width);
  if (maxHeight && crop.height > 0) scales.push(maxHeight / crop.height);
  const scale = Math.min(...scales);

  return {
    width: Math.max(1, Math.round(crop.width * scale)),
    height: Math.max(1, Math.round(crop.height * scale)),
  };
}
