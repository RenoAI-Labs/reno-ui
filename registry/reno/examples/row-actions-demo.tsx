"use client";

import { ArchiveIcon, CheckIcon, CopyIcon, EyeIcon, MailIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { RowActions } from "@/components/ui/row-actions";

export default function RowActionsDemo() {
  return (
    <RowActions
      actions={[
        { key: "view", label: "Xem", icon: <EyeIcon />, onSelect: () => undefined },
        { key: "edit", label: "Sửa", icon: <PencilIcon />, onSelect: () => undefined },
        { key: "mail", label: "Gửi email", icon: <MailIcon />, onSelect: () => undefined },
        { key: "approve", label: "Duyệt", icon: <CheckIcon />, onSelect: () => undefined },
        { key: "copy", label: "Nhân bản", icon: <CopyIcon />, onSelect: () => undefined },
        { key: "archive", label: "Lưu trữ", icon: <ArchiveIcon />, onSelect: () => undefined },
        {
          key: "delete",
          label: "Xóa",
          icon: <Trash2Icon />,
          destructive: true,
          onSelect: () => undefined,
          confirm: { title: "Xóa nhân viên này?", description: "Thao tác không thể hoàn tác." },
        },
      ]}
    />
  );
}
