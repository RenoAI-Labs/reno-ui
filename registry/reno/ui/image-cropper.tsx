"use client";

import * as React from "react";
import { CropIcon, ImageIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  centeredCrop,
  clampCrop,
  moveCrop,
  resizeCropCorner,
  type CropBounds,
  type CropCorner,
  type CropRect,
} from "./image-cropper/crop-geometry";
import { cropImageToFile, type CropOutputOptions } from "./image-cropper/crop-to-file";

/**
 * Crop and downscale an image in the browser, before it is uploaded.
 *
 * The component does NOT upload, for the same reason `file-upload` does not:
 * every project sends bytes somewhere different. It hands back a `File` and
 * stops there. What it does own is the part no server does for us — the
 * projects consuming this upload straight to object storage with a presigned
 * PUT, so a 12 MP phone photo is stored at 12 MP unless it is cut down here.
 *
 * Zero new dependencies, on purpose. A crop surface is a rectangle, four
 * handles and one `drawImage` call; pulling a package in for it would put
 * another version range in every consuming project's lockfile for maybe 200
 * lines of maths that never changes.
 */

export type { CropRect, CropBounds, CropCorner } from "./image-cropper/crop-geometry";
export type { CropOutputOptions } from "./image-cropper/crop-to-file";
export { cropImageToFile } from "./image-cropper/crop-to-file";

export type ImageCropperLabels = {
  hint: string;
  browse: string;
  change: string;
  /**
   * Accessible name for the visually hidden `<input type="file">`.
   *
   * Same trap as in `file-upload`: the input is driven by a visible button, but
   * it is still its own node in the accessibility tree, and an unnamed one is a
   * critical axe violation on every page that renders a cropper.
   */
  inputLabel: string;
  /** Accessible name of the draggable selection. */
  selection: string;
  /** Read out on focus so a keyboard user learns the two gestures. */
  keyboardHint: string;
  confirm: string;
  cropping: string;
  size: (width: number, height: number) => string;
  failed: string;
};

export const defaultImageCropperLabels: ImageCropperLabels = {
  hint: "Chọn một ảnh để cắt",
  browse: "Chọn ảnh",
  change: "Đổi ảnh",
  inputLabel: "Chọn ảnh để cắt",
  selection: "Vùng cắt",
  keyboardHint: "Dùng phím mũi tên để di chuyển vùng cắt, giữ Shift và bấm mũi tên để đổi kích thước.",
  confirm: "Cắt ảnh",
  cropping: "Đang cắt...",
  size: (width, height) => `Vùng cắt ${width} x ${height} px`,
  failed: "Không cắt được ảnh.",
};

export const englishImageCropperLabels: ImageCropperLabels = {
  hint: "Choose an image to crop",
  browse: "Choose image",
  change: "Change image",
  inputLabel: "Choose an image to crop",
  selection: "Crop selection",
  keyboardHint: "Arrow keys move the selection, Shift with an arrow key resizes it.",
  confirm: "Crop image",
  cropping: "Cropping...",
  size: (width, height) => `Selection ${width} x ${height} px`,
  failed: "Could not crop the image.",
};

/** Which corner a pointer grabbed, plus where the rectangle stood when it did. */
type DragState = {
  pointerId: number;
  corner: CropCorner | null;
  originX: number;
  originY: number;
  startCrop: CropRect;
  /** Natural pixels per CSS pixel, sampled once so a re-render cannot shift it. */
  scale: number;
};

/*
  Handles sit fully INSIDE the selection, not straddling its corners.

  The overhanging version is the prettier one, and it does not work: the crop
  surface has to clip the mask that dims everything outside the selection, and a
  clipped pixel is not hit-testable — so the moment the selection touched an
  edge of the image, the handle a user needs most stopped responding to the
  pointer entirely.
*/
const HANDLE_POSITION: Record<CropCorner, string> = {
  nw: "left-0 top-0 cursor-nwse-resize",
  ne: "right-0 top-0 cursor-nesw-resize",
  sw: "left-0 bottom-0 cursor-nesw-resize",
  se: "right-0 bottom-0 cursor-nwse-resize",
};

const CORNERS = Object.keys(HANDLE_POSITION) as CropCorner[];

function ImageCropper({
  className,
  src,
  accept = "image/*",
  aspect,
  minSize = 24,
  maxWidth,
  maxHeight,
  outputType,
  quality,
  crop: controlledCrop,
  onCropChange,
  onFileSelect,
  onCropped,
  onError,
  disabled,
  crossOrigin,
  labels: labelOverrides,
  ...props
}: Omit<React.ComponentProps<"div">, "onError"> & {
  /** Source the project owns. Leave unset to let the component pick a file. */
  src?: string;
  /** Same grammar as the native input. */
  accept?: string;
  /** width / height. Locks the selection's shape when set. */
  aspect?: number;
  /** Smallest selection, in the image's own pixels. */
  minSize?: number;
  /** Cap on the exported bitmap. Downscales only. */
  maxWidth?: number;
  maxHeight?: number;
  /** Encoder for the exported file. Defaults to image/jpeg. */
  outputType?: string;
  quality?: number;
  /** Selection in natural pixels. Pass it to control the rectangle. */
  crop?: CropRect;
  onCropChange?: (crop: CropRect) => void;
  onFileSelect?: (file: File) => void;
  /** Receives the cropped, downscaled file. Awaited, so the button can wait. */
  onCropped?: (file: File) => void | Promise<void>;
  onError?: (error: Error) => void;
  disabled?: boolean;
  /** Needed before a cross-origin `src` can be exported; the canvas taints without it. */
  crossOrigin?: "anonymous" | "use-credentials";
  labels?: Partial<ImageCropperLabels>;
}) {
  const labels = React.useMemo(
    () => ({ ...defaultImageCropperLabels, ...labelOverrides }),
    [labelOverrides],
  );

  const inputRef = React.useRef<HTMLInputElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const dragRef = React.useRef<DragState | null>(null);
  /** The source whose dimensions are already reflected in `bounds`. */
  const adoptedSrcRef = React.useRef<string | null>(null);

  const [pickedUrl, setPickedUrl] = React.useState<string | null>(null);
  const [pickedName, setPickedName] = React.useState<string | null>(null);
  const [bounds, setBounds] = React.useState<CropBounds | null>(null);
  const [internalCrop, setInternalCrop] = React.useState<CropRect | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);

  const resolvedSrc = src ?? pickedUrl;
  const crop = controlledCrop ?? internalCrop;
  const hintId = React.useId();
  const sizeId = React.useId();

  // An object URL is a document-lifetime allocation; without this every image
  // the user tries leaks its decoded bitmap until the tab closes.
  React.useEffect(() => {
    if (!pickedUrl) return;
    return () => URL.revokeObjectURL(pickedUrl);
  }, [pickedUrl]);

  const applyCrop = React.useCallback(
    (next: CropRect) => {
      setInternalCrop(next);
      onCropChange?.(next);
    },
    [onCropChange],
  );

  const adoptImage = React.useCallback(
    (image: HTMLImageElement) => {
      adoptedSrcRef.current = resolvedSrc;
      const next: CropBounds = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      setBounds(next);
      setFailure(null);
      // A controlled crop belongs to the caller even on a fresh image; only
      // re-centre what we own, or the caller's rectangle is overwritten by the
      // load event it never sees.
      if (!controlledCrop) applyCrop(centeredCrop(next, aspect));
    },
    [applyCrop, aspect, controlledCrop, resolvedSrc],
  );

  /*
    An image that is already decoded when React attaches its handler never
    fires `load` — which is every server-rendered page on a warm cache, and was
    the state the docs page shipped in: image visible, no selection, confirm
    button permanently disabled. The ref, not the `bounds` state, is the guard,
    because this runs after every render on purpose: a caller passing an inline
    `onCropChange` changes `adoptImage`'s identity each time, and a dependency
    array here would either re-centre the selection on every keystroke or miss
    the image entirely.
  */
  React.useEffect(() => {
    const image = imageRef.current;
    if (!image || !resolvedSrc) return;
    if (adoptedSrcRef.current === resolvedSrc) return;
    if (!image.complete || image.naturalWidth === 0) return;
    adoptImage(image);
  });

  const selectFile = (file: File | undefined) => {
    if (!file) return;
    setPickedUrl(URL.createObjectURL(file));
    setPickedName(file.name);
    setBounds(null);
    setInternalCrop(null);
    setFailure(null);
    onFileSelect?.(file);
  };

  const startDrag = (event: React.PointerEvent<HTMLElement>, corner: CropCorner | null) => {
    if (disabled || !crop || !bounds || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    if (rect.width === 0) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      corner,
      originX: event.clientX,
      originY: event.clientY,
      startCrop: crop,
      scale: bounds.width / rect.width,
    };
  };

  const continueDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !bounds) return;

    const dx = (event.clientX - drag.originX) * drag.scale;
    const dy = (event.clientY - drag.originY) * drag.scale;

    applyCrop(
      drag.corner
        ? resizeCropCorner(drag.startCrop, drag.corner, dx, dy, bounds, minSize, aspect)
        : moveCrop(drag.startCrop, dx, dy, bounds),
    );
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  };

  /**
   * Arrows move, Shift+arrows resize from the bottom-right corner.
   *
   * The step is a percentage of the image rather than one pixel: a single
   * natural pixel on a 4000 px photo is invisible, so a keyboard user would
   * hold an arrow key for a minute to cross the frame. Shift is the only
   * modifier used, because Alt and Ctrl arrow combinations are taken by the
   * operating system on both platforms we support.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !crop || !bounds) return;

    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = deltas[event.key];
    if (!delta) return;

    event.preventDefault();
    const step = Math.max(1, Math.round(bounds.width / 100));
    const [dx, dy] = [delta[0] * step, delta[1] * step];

    applyCrop(
      event.shiftKey
        ? resizeCropCorner(crop, "se", dx, dy, bounds, minSize, aspect)
        : moveCrop(crop, dx, dy, bounds),
    );
  };

  const handleConfirm = async () => {
    const image = imageRef.current;
    if (!image || !crop || !bounds) return;

    setBusy(true);
    setFailure(null);
    try {
      const options: CropOutputOptions = {
        maxWidth,
        maxHeight,
        type: outputType,
        quality,
        fileName: pickedName ?? undefined,
      };
      await onCropped?.(await cropImageToFile(image, clampCrop(crop, bounds, 1), options));
    } catch (error) {
      const failed = error instanceof Error ? error : new Error(labels.failed);
      setFailure(failed.message);
      onError?.(failed);
    } finally {
      setBusy(false);
    }
  };

  const percent = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div
      data-slot="image-cropper"
      className={cn("flex w-full flex-col gap-[var(--density-gap)]", className)}
      {...props}
    >
      {resolvedSrc ? (
        <div
          data-slot="image-cropper-surface"
          className="border-input bg-muted relative w-full overflow-hidden rounded-md border"
        >
          {/*
            A plain `<img>`, not `next/image`: primitives here must run in any
            React app, and the boundary check rejects a `next/*` import in
            `registry/reno/ui`. The element is also the crop source handed to
            `drawImage`, so it has to be a real DOM node either way.
          */}
          {/* eslint-disable-next-line */}
          <img
            ref={imageRef}
            src={resolvedSrc}
            alt=""
            crossOrigin={crossOrigin}
            draggable={false}
            onLoad={(event) => adoptImage(event.currentTarget)}
            onError={() => {
              adoptedSrcRef.current = resolvedSrc;
              setBounds(null);
              setFailure(labels.failed);
            }}
            className="block h-auto w-full select-none"
          />

          {crop && bounds ? (
            <div
              data-slot="image-cropper-selection"
              role="group"
              tabIndex={disabled ? -1 : 0}
              aria-label={labels.selection}
              aria-describedby={`${sizeId} ${hintId}`}
              aria-disabled={disabled || undefined}
              onPointerDown={(event) => startDrag(event, null)}
              onPointerMove={continueDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={handleKeyDown}
              style={{
                left: percent(crop.x, bounds.width),
                top: percent(crop.y, bounds.height),
                width: percent(crop.width, bounds.width),
                height: percent(crop.height, bounds.height),
              }}
              className={cn(
                "absolute touch-none",
                // One giant spread shadow dims everything outside the selection,
                // so the mask stays a single element that can never drift out of
                // sync with the rectangle it surrounds.
                "shadow-[0_0_0_9999px_var(--overlay)]",
                "outline-2 outline-offset-0 outline-primary",
                "focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-[3px]",
                disabled ? "cursor-not-allowed" : "cursor-move",
              )}
            >
              {CORNERS.map((corner) => (
                <span
                  key={corner}
                  data-slot="image-cropper-handle"
                  data-corner={corner}
                  aria-hidden="true"
                  onPointerDown={(event) => startDrag(event, corner)}
                  onPointerMove={continueDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className={cn(
                    // 24px of grab area around a 10px dot: WCAG 2.2 asks for a
                    // 24x24 target, and a dot that big would hide the corner it
                    // is meant to point at.
                    "absolute flex size-6 touch-none items-center justify-center",
                    disabled && "hidden",
                    HANDLE_POSITION[corner],
                  )}
                >
                  <span className="bg-primary border-background block size-2.5 rounded-full border-2" />
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          data-slot="image-cropper-empty"
          className="border-input flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center"
        >
          <ImageIcon className="text-muted-foreground size-6" aria-hidden="true" />
          <p className="text-sm font-medium">{labels.hint}</p>
        </div>
      )}

      <p id={hintId} className="sr-only">
        {labels.keyboardHint}
      </p>

      <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
        {/*
          `aria-live` and not just a description: the size changes while the
          selection is dragged, and a keyboard user moving it by arrow key has
          no other way to know what the rectangle now covers.
        */}
        <p
          id={sizeId}
          aria-live="polite"
          className="text-muted-foreground mr-auto text-xs tabular-nums"
        >
          {crop ? labels.size(Math.round(crop.width), Math.round(crop.height)) : null}
        </p>

        {src ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {resolvedSrc ? (
              <RefreshCwIcon aria-hidden="true" />
            ) : (
              <ImageIcon aria-hidden="true" />
            )}
            {resolvedSrc ? labels.change : labels.browse}
          </Button>
        )}

        {onCropped ? (
          <Button
            type="button"
            size="sm"
            disabled={disabled || busy || !crop || !bounds}
            aria-busy={busy || undefined}
            onClick={handleConfirm}
          >
            <CropIcon aria-hidden="true" />
            {busy ? labels.cropping : labels.confirm}
          </Button>
        ) : null}
      </div>

      {failure ? (
        <p role="alert" className="text-destructive text-xs">
          {failure}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        aria-label={labels.inputLabel}
        className="sr-only"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          // Reset so re-picking the same file fires change again.
          event.target.value = "";
        }}
      />
    </div>
  );
}

export { ImageCropper };
