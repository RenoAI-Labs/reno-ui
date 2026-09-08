import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImageCropper } from "@/components/ui/image-cropper";
import {
  centeredCrop,
  clampCrop,
  moveCrop,
  outputSize,
  resizeCropCorner,
} from "@/components/ui/image-cropper/crop-geometry";

/**
 * The geometry carries the edge cases, so it gets the arithmetic tests; the
 * component gets the contract tests that a project would notice breaking —
 * the file input has a name, the selection is reachable by keyboard, and the
 * crop is reported in the image's own pixels rather than screen pixels.
 *
 * Cropping to a File is deliberately not exercised here: jsdom's canvas has no
 * 2d context and no encoder, so a test of it would only assert that a stub
 * throws.
 */

const BOUNDS = { width: 1000, height: 500 };

/** jsdom reports 0x0 for every element, which would make the drag scale NaN. */
function stubImageLayout(naturalWidth: number, naturalHeight: number, cssWidth: number) {
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
    configurable: true,
    get: () => naturalWidth,
  });
  Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", {
    configurable: true,
    get: () => naturalHeight,
  });
  HTMLImageElement.prototype.getBoundingClientRect = function rect() {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: cssWidth,
      bottom: cssWidth * (naturalHeight / naturalWidth),
      width: cssWidth,
      height: cssWidth * (naturalHeight / naturalWidth),
      toJSON: () => ({}),
    } as DOMRect;
  };
}

describe("crop geometry", () => {
  it("centres the starting selection and honours the aspect lock", () => {
    const crop = centeredCrop(BOUNDS, 2, 0.8);
    expect(crop.width / crop.height).toBeCloseTo(2, 5);
    expect(crop.x + crop.width / 2).toBeCloseTo(BOUNDS.width / 2, 0);
    expect(crop.y + crop.height / 2).toBeCloseTo(BOUNDS.height / 2, 0);
  });

  it("fits the aspect lock to the short side of a wide image", () => {
    // 1000x500 cannot hold a 1:1 crop 1000 wide; the height is the limit.
    const crop = centeredCrop(BOUNDS, 1, 1);
    expect(crop.width).toBe(500);
    expect(crop.height).toBe(500);
  });

  it("stops a move at the edge instead of shrinking the selection", () => {
    const start = { x: 900, y: 400, width: 100, height: 100 };
    const moved = moveCrop(start, 500, 500, BOUNDS);
    expect(moved).toEqual({ x: 900, y: 400, width: 100, height: 100 });
  });

  it("keeps the opposite corner anchored while resizing", () => {
    const start = { x: 100, y: 100, width: 200, height: 200 };
    const resized = resizeCropCorner(start, "nw", -50, -50, BOUNDS, 10);
    expect(resized.x + resized.width).toBe(300);
    expect(resized.y + resized.height).toBe(300);
    expect(resized).toMatchObject({ x: 50, y: 50, width: 250, height: 250 });
  });

  it("never lets a corner cross its anchor", () => {
    const start = { x: 100, y: 100, width: 200, height: 200 };
    const resized = resizeCropCorner(start, "se", -900, -900, BOUNDS, 10);
    expect(resized.width).toBeGreaterThan(0);
    expect(resized.height).toBeGreaterThan(0);
    expect(resized.x).toBe(100);
    expect(resized.y).toBe(100);
  });

  it("holds the ratio when a locked resize runs into the edge", () => {
    const start = { x: 0, y: 0, width: 200, height: 100 };
    const resized = resizeCropCorner(start, "se", 2000, 2000, BOUNDS, 10, 2);
    expect(resized.width / resized.height).toBeCloseTo(2, 1);
    expect(resized.x + resized.width).toBeLessThanOrEqual(BOUNDS.width);
    expect(resized.y + resized.height).toBeLessThanOrEqual(BOUNDS.height);
  });

  it("pulls an out-of-bounds rectangle back inside", () => {
    const clamped = clampCrop({ x: 950, y: 480, width: 200, height: 200 }, BOUNDS, 10);
    expect(clamped.x + clamped.width).toBeLessThanOrEqual(BOUNDS.width);
    expect(clamped.y + clamped.height).toBeLessThanOrEqual(BOUNDS.height);
  });

  it("downscales to the max dimension but never enlarges", () => {
    expect(outputSize({ x: 0, y: 0, width: 2000, height: 1000 }, 500)).toEqual({
      width: 500,
      height: 250,
    });
    expect(outputSize({ x: 0, y: 0, width: 100, height: 50 }, 4000)).toEqual({
      width: 100,
      height: 50,
    });
  });
});

describe("ImageCropper", () => {
  it("names the hidden file input, which is a labelable control of its own", () => {
    render(<ImageCropper />);
    expect(screen.getByLabelText("Chọn ảnh để cắt")).toHaveAttribute("type", "file");
  });

  it("shows the picker only while the project does not own the source", () => {
    const { rerender } = render(<ImageCropper />);
    expect(screen.getByRole("button", { name: "Chọn ảnh" })).toBeInTheDocument();

    rerender(<ImageCropper src="/media/sample-photo.png" />);
    expect(screen.queryByRole("button", { name: "Chọn ảnh" })).not.toBeInTheDocument();
  });

  it("reports the selection in the image's own pixels once it loads", () => {
    stubImageLayout(1000, 500, 400);
    const onCropChange = vi.fn();
    const { container } = render(
      <ImageCropper src="/media/sample-photo.png" aspect={2} onCropChange={onCropChange} />,
    );

    fireEvent.load(container.querySelector("img")!);

    expect(onCropChange).toHaveBeenCalledWith(
      expect.objectContaining({ width: 900, height: 450 }),
    );
    expect(screen.getByRole("group", { name: "Vùng cắt" })).toBeInTheDocument();
  });

  it("moves the selection with the arrow keys and resizes it with Shift", () => {
    stubImageLayout(1000, 500, 400);
    const onCropChange = vi.fn();
    const { container } = render(
      <ImageCropper src="/media/sample-photo.png" onCropChange={onCropChange} />,
    );
    fireEvent.load(container.querySelector("img")!);

    const selection = screen.getByRole("group", { name: "Vùng cắt" });
    const start = onCropChange.mock.calls.at(-1)![0];

    fireEvent.keyDown(selection, { key: "ArrowRight" });
    const moved = onCropChange.mock.calls.at(-1)![0];
    expect(moved.x).toBeGreaterThan(start.x);
    expect(moved.width).toBe(start.width);

    fireEvent.keyDown(selection, { key: "ArrowLeft", shiftKey: true });
    const resized = onCropChange.mock.calls.at(-1)![0];
    expect(resized.width).toBeLessThan(moved.width);
  });

  it("adopts an image that finished decoding before the handler was attached", () => {
    // The failure this pins: on a server-rendered page with a warm cache the
    // image is already `complete` at hydration, `load` never fires, and the
    // surface shipped with no selection and a permanently disabled button.
    stubImageLayout(1000, 500, 400);
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get: () => true,
    });

    try {
      render(<ImageCropper src="/media/sample-photo.png" onCropped={vi.fn()} />);
      expect(screen.getByRole("group", { name: "Vùng cắt" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cắt ảnh/ })).toBeEnabled();
    } finally {
      Reflect.deleteProperty(HTMLImageElement.prototype, "complete");
    }
  });

  it("announces the selection size, since a drag changes it with no other cue", () => {
    stubImageLayout(1000, 500, 400);
    const { container } = render(<ImageCropper src="/media/sample-photo.png" />);
    fireEvent.load(container.querySelector("img")!);

    const readout = container.querySelector("[aria-live='polite']");
    expect(readout).toHaveTextContent("900 x 450 px");
  });
});
