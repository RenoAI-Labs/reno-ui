"use client";

import * as React from "react";

import {
  PermissionMatrix,
  type PermissionGrants,
  type PermissionGroup,
  type PermissionRole,
} from "@/components/ui/permission-matrix";

const ROLES: PermissionRole[] = [
  { id: "admin", label: "Admin" },
  { id: "teacher", label: "Giảng viên" },
  { id: "student", label: "Học viên" },
];

const GROUPS: PermissionGroup[] = [
  {
    id: "accounts",
    label: "Tài khoản và vai trò",
    rows: [
      { id: "accounts.read", label: "Xem" },
      { id: "accounts.write", label: "Tạo và sửa", scope: "own" },
      { id: "accounts.delete", label: "Xóa" },
      { id: "accounts.all", label: "Toàn quyền", implies: ["accounts.read", "accounts.write", "accounts.delete"] },
    ],
  },
];

const SAVED: PermissionGrants = {
  admin: ["accounts.read", "accounts.write", "accounts.delete", "accounts.all"],
  teacher: ["accounts.read"],
  student: [],
};

export default function PermissionMatrixDemo() {
  const [saved, setSaved] = React.useState(SAVED);
  const [draft, setDraft] = React.useState(SAVED);

  return (
    <PermissionMatrix
      roles={ROLES}
      groups={GROUPS}
      value={draft}
      savedValue={saved}
      onChange={setDraft}
      onSave={() => setSaved(draft)}
      onRevert={() => setDraft(saved)}
      onCreateRole={() => undefined}
      onEditRole={() => undefined}
      height={320}
    />
  );
}
