"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  DEFAULT_TOOLBAR_GROUPS,
  resolveRichTextLabels,
  type RichTextLabels,
  type RichTextValue,
  type ToolbarGroup,
} from "@/lib/rich-text-value";
import { useRichText } from "@/hooks/use-rich-text";
import { RichTextToolbar } from "@/components/ui/rich-text/toolbar";
import { LinkDialog } from "@/components/ui/rich-text/link-dialog";
import { MediaDialog } from "@/components/ui/rich-text/media-dialog";

/**
 * A rich text editor with its toolbar already built.
 *
 * The thing this component is protecting against is its own growth. A rich text
 * editor is the piece of a component library most likely to expand without end,
 * because every screen wants one more button, and the honest ceiling is what a
 * real editor in production already uses. So `ToolbarGroup` is a closed union of
 * seven groups, and tables, footnotes, mentions and collaborative editing are
 * out — not "not yet", out.
 *
 * **No TipTap type reaches these props.** `use-rich-text.ts` is the only file
 * that imports the package, and `check-boundaries.mjs` fails if that stops being
 * true. A TipTap major bump is a change in that one file rather than a breaking
 * change for every project that installed this one.
 *
 * **The document is HTML, and it is not sanitized here.** What comes out of
 * `onChange` is what the author typed, normalised by TipTap's schema. Anything
 * that reaches a browser has to be sanitized server-side; an editor is not a
 * security boundary. See `docs/rich-text-contract.md`.
 */

export type RichTextProps = {
  /** Controlled. Leave it out and pass `defaultValue` for uncontrolled. */
  value?: RichTextValue;
  defaultValue?: RichTextValue;
  onChange?: (value: RichTextValue) => void;

  /** Defaults to format, heading, list, link and history. */
  groups?: ToolbarGroup[];
  labels?: Partial<RichTextLabels>;
  readOnly?: boolean;

  /**
   * Where an uploaded image goes, and what URL it ends up at.
   *
   * Without this, the media dialog inserts images by URL only — which still
   * works and needs no infrastructure. With it, an upload tab appears and the
   * project owns the bucket, the credentials, the signing and the quota. None of
   * that belongs to a component library, and all of it differs per project.
   *
   * Whatever this checks about the file runs in the browser, so it is a
   * convenience for the author and not a security control. The server has to
   * check again.
   */
  onImageUpload?: (file: File) => Promise<string>;

  /** Minimum height of the editable area. Any CSS length. */
  minHeight?: string;
  className?: string;
};

export function RichText({
  value,
  defaultValue,
  onChange,
  groups = DEFAULT_TOOLBAR_GROUPS,
  labels: labelOverrides,
  readOnly = false,
  onImageUpload,
  minHeight = "12rem",
  className,
}: RichTextProps) {
  const labels = React.useMemo(() => resolveRichTextLabels(labelOverrides), [labelOverrides]);

  const [linkOpen, setLinkOpen] = React.useState(false);
  const [mediaMode, setMediaMode] = React.useState<"image" | "youtube" | null>(null);

  const { content, commands, state } = useRichText({
    value,
    defaultValue,
    onChange,
    editable: !readOnly,
    label: labels.editor,
    /*
      Typography for the document, written in tokens.

      `prose` from a plugin is the usual answer and is not available here:
      reno-ui ships no Tailwind plugins, and a project that has one would get
      two competing sets of rules. These are the elements the seven groups can
      produce, and nothing else.
    */
    contentClassName: cn(
      "outline-none",
      "[&_p]:my-2 [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-semibold",
      "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold",
      "[&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold",
      "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-6",
      "[&_blockquote]:my-2 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground",
      "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
      "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm",
      "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3",
      "[&_hr]:my-4 [&_hr]:border-border",
      "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md",
      "[&_iframe]:my-2 [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:rounded-md",
    ),
  });

  return (
    <div
      data-slot="rich-text"
      className={cn(
        "flex flex-col overflow-hidden rounded-md border border-input focus-within:ring-[3px] focus-within:ring-ring/50",
        className,
      )}
    >
      {/* Hidden rather than disabled when read-only: a toolbar of dead buttons
          is a puzzle, and the document is still readable and selectable. */}
      {readOnly ? null : (
        <RichTextToolbar
          groups={groups}
          state={state}
          commands={commands}
          labels={labels}
          onOpenLink={() => setLinkOpen(true)}
          onOpenImage={() => setMediaMode("image")}
          onOpenYoutube={() => setMediaMode("youtube")}
        />
      )}

      <div
        data-slot="rich-text-content"
        className="overflow-y-auto px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)] text-sm"
        style={{ minHeight }}
      >
        {content}
      </div>

      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        currentHref={state.linkHref}
        selectedText={state.selectedText}
        onSubmit={commands.setLink}
        onRemove={commands.unsetLink}
        labels={labels}
      />

      <MediaDialog
        open={mediaMode !== null}
        onOpenChange={(open) => setMediaMode(open ? mediaMode : null)}
        mode={mediaMode ?? "image"}
        onInsertImage={commands.insertImage}
        onInsertYoutube={commands.insertYoutube}
        onImageUpload={onImageUpload}
        labels={labels}
      />
    </div>
  );
}
