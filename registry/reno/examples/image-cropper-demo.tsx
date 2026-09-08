"use client";

import * as React from "react";

import { ImageCropper } from "@/components/ui/image-cropper";

/*
  The image is served from this repository rather than a CDN, for the reason the
  audio demo records: a demo that fetches across the network turns someone
  else's outage into a red gate here.

  public/media/sample-photo.png is a generated 960x640 gradient with an 80px
  grid and a centred ring — a photograph would look nicer and say less, because
  the grid is what makes it obvious which part of the frame a crop kept. Any
  image of a known size can replace it; scripts/make-sample-photo.mjs rebuilds
  this one.

  Passing `src` means the demo owns the source, so the picker button is hidden.
  Drop the prop and the component picks the file itself.
*/
export default function ImageCropperDemo() {
  const [result, setResult] = React.useState<{ name: string; size: number } | null>(null);

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <ImageCropper
        src="/media/sample-photo.png"
        aspect={16 / 9}
        maxWidth={640}
        className="max-w-lg"
        onCropped={(file) => setResult({ name: file.name, size: file.size })}
      />
      <p className="text-sm text-muted-foreground">
        {result
          ? `Đã cắt: ${result.name} (${Math.round(result.size / 1024)} KB) - dự án tự upload tệp này.`
          : "Kéo vùng cắt rồi bấm Cắt ảnh để nhận File."}
      </p>
    </div>
  );
}
