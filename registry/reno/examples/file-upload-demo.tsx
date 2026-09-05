"use client";

import * as React from "react";

import { FileUpload, type FileUploadItem } from "@/components/ui/file-upload";

export default function FileUploadDemo() {
  const [files, setFiles] = React.useState<FileUploadItem[]>([
    { id: "1", name: "anh-san-pham.webp", size: 248_320, status: "done" },
    { id: "2", name: "video-gioi-thieu.mp4", size: 18_400_000, progress: 62, status: "uploading" },
    { id: "3", name: "tai-lieu.pdf", size: 9_800_000, status: "error", error: "Tệp vượt quá 5 MB." },
  ]);

  return (
    <FileUpload
      accept="image/*,.pdf"
      maxSize={5 * 1024 * 1024}
      multiple
      files={files}
      onFilesAccepted={(accepted) =>
        setFiles((prev) => [
          ...prev,
          ...accepted.map((f, i) => ({ id: `new-${prev.length + i}`, name: f.name, size: f.size, status: "pending" as const })),
        ])
      }
      onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
    />
  );
}
