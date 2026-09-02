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
import type { RichTextLabels } from "@/lib/rich-text-value";

/**
 * Insert, edit or remove a link.
 *
 * One dialog for all three, because from the author's side they are one
 * decision: the URL field arrives pre-filled when the caret is already inside a
 * link, and the remove button appears only then.
 *
 * The text field appears only when nothing is selected. With a selection, the
 * selected words *are* the link text and offering to change them here would
 * silently rewrite the document.
 */
export function LinkDialog({
  open,
  onOpenChange,
  currentHref,
  selectedText,
  onSubmit,
  onRemove,
  labels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The href under the caret, or null when there is no link there. */
  currentHref: string | null;
  selectedText: string;
  onSubmit: (href: string, text?: string) => void;
  onRemove: () => void;
  labels: RichTextLabels;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/*
          The fields live in a child so that opening the dialog mounts them
          fresh. Radix only renders this subtree while the dialog is open, which
          means the state resets by construction — no effect, and no risk of
          handing the author the last URL they typed on a different word.
        */}
        <LinkForm
          currentHref={currentHref}
          selectedText={selectedText}
          onSubmit={onSubmit}
          onRemove={onRemove}
          onClose={() => onOpenChange(false)}
          labels={labels}
        />
      </DialogContent>
    </Dialog>
  );
}

function LinkForm({
  currentHref,
  selectedText,
  onSubmit,
  onRemove,
  onClose,
  labels,
}: {
  currentHref: string | null;
  selectedText: string;
  onSubmit: (href: string, text?: string) => void;
  onRemove: () => void;
  onClose: () => void;
  labels: RichTextLabels;
}) {
  const [href, setHref] = React.useState(currentHref ?? "");
  const [text, setText] = React.useState("");

  const needsText = selectedText.length === 0;
  const canSubmit = href.trim().length > 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(href.trim(), needsText ? text.trim() : undefined);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{labels.linkDialogTitle}</DialogTitle>
      </DialogHeader>

      {/* A form, so Enter submits — the whole interaction is one field. */}
      <form onSubmit={submit} className="flex flex-col gap-[var(--density-gap)]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reno-link-href">{labels.linkUrl}</Label>
          <Input
            id="reno-link-href"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            // Not `type="url"`: the browser's own validation rejects a relative
            // path, and "/gioi-thieu" is a link an author will legitimately
            // want.
            inputMode="url"
            autoFocus
          />
        </div>

        {needsText ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="reno-link-text">{labels.linkText}</Label>
            <Input
              id="reno-link-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={href}
            />
          </div>
        ) : null}

        <DialogFooter>
          {currentHref ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onRemove();
                onClose();
              }}
            >
              {labels.linkRemove}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {labels.linkSave}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
