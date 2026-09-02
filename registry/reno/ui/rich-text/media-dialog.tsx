"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { youtubeVideoId, type RichTextLabels } from "@/lib/rich-text-value";

/**
 * Insert an image, or embed a YouTube video.
 *
 * **reno-ui owns no storage.** The upload tab exists only when the project
 * passes `onImageUpload`, because everything an upload needs — a bucket,
 * credentials, CORS, a signing scheme, a size quota, a virus scan — differs per
 * project and none of it belongs to a component library. With no handler the
 * dialog still works: an image goes in by URL, which needs no infrastructure at
 * all.
 *
 * The upload's in-flight and failed states are rendered rather than swallowed.
 * A silent failure here looks exactly like a slow network, and the author's
 * response to the two is different.
 */
export function MediaDialog({
  open,
  onOpenChange,
  mode,
  onInsertImage,
  onInsertYoutube,
  onImageUpload,
  labels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "image" | "youtube";
  onInsertImage: (src: string, alt?: string) => void;
  /** Returns false when the URL is not a YouTube link this can embed. */
  onInsertYoutube: (url: string) => boolean;
  /** Absent means no upload tab, and insert-by-URL only. */
  onImageUpload?: (file: File) => Promise<string>;
  labels: RichTextLabels;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/*
          The fields live in a child so that opening the dialog mounts them
          fresh. Radix renders this subtree only while the dialog is open, so
          the URL, the alt text and any failed upload reset by construction —
          no effect, and no half-filled form on the next open.
        */}
        {mode === "youtube" ? (
          <YoutubeForm
            onInsert={onInsertYoutube}
            onClose={() => onOpenChange(false)}
            labels={labels}
          />
        ) : (
          <ImageForm
            onInsert={onInsertImage}
            onImageUpload={onImageUpload}
            onClose={() => onOpenChange(false)}
            labels={labels}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function YoutubeForm({
  onInsert,
  onClose,
  labels,
}: {
  onInsert: (url: string) => boolean;
  onClose: () => void;
  labels: RichTextLabels;
}) {
  const [url, setUrl] = React.useState("");
  const [invalid, setInvalid] = React.useState(false);

  const insert = () => {
    if (!onInsert(url)) {
      setInvalid(true);
      return;
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{labels.youtubeDialogTitle}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reno-youtube-url">{labels.youtubeUrl}</Label>
        <Input
          id="reno-youtube-url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setInvalid(false);
          }}
          inputMode="url"
          autoFocus
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "reno-youtube-error" : undefined}
        />
        {invalid ? (
          <p id="reno-youtube-error" role="alert" className="text-sm text-destructive">
            {labels.youtubeInvalid}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {labels.cancel}
        </Button>
        {/*
          Disabled until the URL parses, so the error message is for a paste
          that looks plausible rather than for every half-typed character.
        */}
        <Button onClick={insert} disabled={youtubeVideoId(url) === null}>
          {labels.youtubeInsert}
        </Button>
      </DialogFooter>
    </>
  );
}

function ImageForm({
  onInsert,
  onImageUpload,
  onClose,
  labels,
}: {
  onInsert: (src: string, alt?: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  onClose: () => void;
  labels: RichTextLabels;
}) {
  const [url, setUrl] = React.useState("");
  const [alt, setAlt] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(false);

  const insertByUrl = () => {
    if (!url.trim()) return;
    onInsert(url.trim(), alt.trim() || undefined);
    onClose();
  };

  const upload = async (file: File) => {
    if (!onImageUpload) return;
    setUploading(true);
    setUploadError(false);
    try {
      const src = await onImageUpload(file);
      onInsert(src, alt.trim() || undefined);
      onClose();
    } catch {
      // The reason is the project's to report; this only has to stop pretending
      // an image was inserted. Nothing is inserted on failure, so the document
      // never ends up carrying a broken `<img>`.
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{labels.imageDialogTitle}</DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="url">
        {/* One tab is not a tab. With no upload handler the list is hidden and
            the URL panel is simply the dialog's body. */}
        {onImageUpload ? (
          <TabsList>
            <TabsTrigger value="url">{labels.tabUrl}</TabsTrigger>
            <TabsTrigger value="upload">{labels.tabUpload}</TabsTrigger>
          </TabsList>
        ) : null}

        <TabsContent value="url" className="flex flex-col gap-[var(--density-gap)]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reno-image-url">{labels.imageUrl}</Label>
            <Input
              id="reno-image-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              inputMode="url"
              autoFocus
            />
          </div>
          <AltField alt={alt} onAlt={setAlt} labels={labels} />
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {labels.cancel}
            </Button>
            <Button onClick={insertByUrl} disabled={!url.trim()}>
              {labels.imageInsert}
            </Button>
          </DialogFooter>
        </TabsContent>

        {onImageUpload ? (
          <TabsContent value="upload" className="flex flex-col gap-[var(--density-gap)]">
            <AltField alt={alt} onAlt={setAlt} labels={labels} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="reno-image-file">{labels.imageUpload}</Label>
              <Input
                id="reno-image-file"
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
            </div>

            {uploading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" label={labels.imageUploading} />
                {labels.imageUploading}
              </p>
            ) : null}

            {uploadError ? (
              <p role="alert" className="text-sm text-destructive">
                {labels.imageUploadFailed}
              </p>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {labels.cancel}
              </Button>
            </DialogFooter>
          </TabsContent>
        ) : null}
      </Tabs>
    </>
  );
}

/**
 * Alt text, on both tabs.
 *
 * Optional, and deliberately not required: an empty `alt` is the correct markup
 * for a decorative image, and forcing a value teaches authors to type "image".
 */
function AltField({
  alt,
  onAlt,
  labels,
}: {
  alt: string;
  onAlt: (value: string) => void;
  labels: RichTextLabels;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="reno-image-alt">{labels.imageAlt}</Label>
      <Input id="reno-image-alt" value={alt} onChange={(event) => onAlt(event.target.value)} />
    </div>
  );
}
