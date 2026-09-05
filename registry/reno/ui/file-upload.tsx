"use client";

import * as React from "react";
import { FileIcon, TrashIcon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Drop zone with a file list, per-file progress and type / size guards.
 *
 * The component does NOT upload. It hands accepted files to the project and
 * renders whatever progress the project reports back, because every project
 * uploads differently (presigned PUT, multipart, a job queue) and baking one in
 * would make the component wrong for the other three.
 *
 * Rejections are reported rather than swallowed: a file silently vanishing
 * because it was 2 KB over a limit is the failure mode this guards against.
 */

export type FileUploadItem = {
  /** Stable key. Use the server id once known, a local uuid before that. */
  id: string;
  name: string;
  /** Bytes. Rendered with the same formatter as the size guard message. */
  size: number;
  /** 0-100. Omit for a file that is not being uploaded right now. */
  progress?: number;
  status?: "pending" | "uploading" | "done" | "error";
  /** Shown under the row when status is "error". */
  error?: string;
};

export type FileUploadRejection = {
  file: File;
  reason: "type" | "size";
};

export type FileUploadLabels = {
  hint: string;
  browse: string;
  remove: string;
  maxSize: (formatted: string) => string;
  accepted: (list: string) => string;
  rejectedType: string;
  rejectedSize: (formatted: string) => string;
};

export const defaultFileUploadLabels: FileUploadLabels = {
  hint: "Kéo thả tệp vào đây",
  browse: "Chọn tệp",
  remove: "Xoá tệp",
  maxSize: (formatted) => `Tối đa ${formatted} mỗi tệp`,
  accepted: (list) => `Định dạng: ${list}`,
  rejectedType: "Định dạng không được chấp nhận.",
  rejectedSize: (formatted) => `Tệp vượt quá ${formatted}.`,
};

export const englishFileUploadLabels: FileUploadLabels = {
  hint: "Drag and drop files here",
  browse: "Choose files",
  remove: "Remove file",
  maxSize: (formatted) => `Up to ${formatted} per file`,
  accepted: (list) => `Formats: ${list}`,
  rejectedType: "That file type is not accepted.",
  rejectedSize: (formatted) => `File exceeds ${formatted}.`,
};

/** 1 KB = 1024 B, matching what an operating system reports. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

/** Matches the `accept` grammar: ".pdf", "image/*", "image/png". */
function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  return accept
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
      if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1));
      return file.type.toLowerCase() === rule;
    });
}

function FileUpload({
  className,
  accept,
  maxSize,
  multiple = false,
  disabled,
  files = [],
  onFilesAccepted,
  onFilesRejected,
  onRemove,
  labels: labelOverrides,
  ...props
}: Omit<React.ComponentProps<"div">, "onDrop"> & {
  /** Same grammar as the native input: ".png,.webp" or "image/*". */
  accept?: string;
  /** Bytes. A file over this is rejected, never silently dropped. */
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  /** The list to render. The project owns it, including progress. */
  files?: FileUploadItem[];
  onFilesAccepted?: (files: File[]) => void;
  onFilesRejected?: (rejections: FileUploadRejection[]) => void;
  onRemove?: (id: string) => void;
  labels?: Partial<FileUploadLabels>;
}) {
  const labels = React.useMemo(
    () => ({ ...defaultFileUploadLabels, ...labelOverrides }),
    [labelOverrides],
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const intake = React.useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const accepted: File[] = [];
      const rejected: FileUploadRejection[] = [];
      for (const file of Array.from(list)) {
        if (!matchesAccept(file, accept)) rejected.push({ file, reason: "type" });
        else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: "size" });
        else accepted.push(file);
      }
      if (accepted.length) onFilesAccepted?.(multiple ? accepted : accepted.slice(0, 1));
      if (rejected.length) onFilesRejected?.(rejected);
    },
    [accept, maxSize, multiple, onFilesAccepted, onFilesRejected],
  );

  return (
    <div data-slot="file-upload" className={cn("flex flex-col gap-3", className)} {...props}>
      <div
        data-slot="file-upload-dropzone"
        data-dragging={dragging || undefined}
        className={cn(
          "border-input flex flex-col items-center justify-center gap-2 rounded-md border border-dashed",
          "p-6 text-center transition-colors",
          "data-[dragging]:border-ring data-[dragging]:bg-accent",
          disabled && "pointer-events-none opacity-50",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          intake(event.dataTransfer.files);
        }}
      >
        <UploadIcon className="text-muted-foreground size-6" aria-hidden="true" />
        <p className="text-sm font-medium">{labels.hint}</p>
        <p className="text-muted-foreground text-xs">
          {accept ? labels.accepted(accept) : null}
          {accept && maxSize !== undefined ? " · " : null}
          {maxSize !== undefined ? labels.maxSize(formatBytes(maxSize)) : null}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {labels.browse}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => {
            intake(event.target.files);
            // Reset so re-picking the same file fires change again.
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul data-slot="file-upload-list" className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              data-slot="file-upload-item"
              data-status={file.status}
              className="border-input flex items-center gap-3 rounded-md border p-2"
            >
              <FileIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{file.name}</p>
                <p className="text-muted-foreground text-xs tabular-nums">{formatBytes(file.size)}</p>
                {file.status === "uploading" && file.progress !== undefined ? (
                  <Progress value={file.progress} className="mt-1" />
                ) : null}
                {file.status === "error" && file.error ? (
                  <p className="text-destructive mt-1 text-xs">{file.error}</p>
                ) : null}
              </div>
              {onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={labels.remove}
                  onClick={() => onRemove(file.id)}
                >
                  <TrashIcon aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { FileUpload };
