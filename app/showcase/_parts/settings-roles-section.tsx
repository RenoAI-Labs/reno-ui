"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PermissionMatrix,
  type PermissionGrants,
  type PermissionRole,
} from "@/components/ui/permission-matrix";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DEFAULT_GRANTS, PERMISSION_GROUPS, PERMISSION_ROLES } from "./mock-admin-data";

/** Three sample accounts and the roles each starts with. */
const SAMPLE_USERS = [
  { id: "ha", name: "Nguyễn Thu Hà", roles: ["hr", "manager"] },
  { id: "quan", name: "Trần Minh Quân", roles: ["recruiter"] },
  { id: "ngoc", name: "Lê Bảo Ngọc", roles: ["accountant", "auditor"] },
];

const CUSTOM_ROLE_PREFIX = "custom-";

export function RolesSection() {
  const [roles, setRoles] = React.useState<PermissionRole[]>(PERMISSION_ROLES);
  const [saved, setSaved] = React.useState<PermissionGrants>(DEFAULT_GRANTS);
  const [draft, setDraft] = React.useState<PermissionGrants>(DEFAULT_GRANTS);
  const [justSaved, setJustSaved] = React.useState(false);
  const [renaming, setRenaming] = React.useState<{ id: string; label: string } | null>(null);

  const [userId, setUserId] = React.useState(SAMPLE_USERS[0].id);
  const [assigned, setAssigned] = React.useState<Record<string, string[]>>(() =>
    Object.fromEntries(SAMPLE_USERS.map((user) => [user.id, user.roles])),
  );

  React.useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const createRole = () => {
    const n = roles.filter((role) => role.id.startsWith(CUSTOM_ROLE_PREFIX)).length + 1;
    const id = `${CUSTOM_ROLE_PREFIX}${n}`;
    setRoles((list) => [...list, { id, label: `Vai trò mới ${n}` }]);
    // Added to both snapshots: a new empty column is structure, not an unsaved cell change.
    setSaved((grants) => ({ ...grants, [id]: [] }));
    setDraft((grants) => ({ ...grants, [id]: [] }));
  };

  const toggleAssigned = (roleId: string, on: boolean) =>
    setAssigned((current) => {
      const held = new Set(current[userId]);
      if (on) held.add(roleId);
      else held.delete(roleId);
      return { ...current, [userId]: [...held] };
    });

  const heldRoles = assigned[userId] ?? [];
  // Effective permissions are the union of the held roles' columns in the current draft.
  const effective = new Set(heldRoles.flatMap((roleId) => draft[roleId] ?? []));

  return (
    <div className="grid gap-[var(--density-gap)] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-2">
        <p
          role="status"
          className="flex min-h-5 items-center gap-1 text-sm text-success-soft-foreground"
        >
          {justSaved ? (
            <>
              <CheckIcon className="size-4" aria-hidden />
              Đã lưu
            </>
          ) : null}
        </p>
        <PermissionMatrix
          roles={roles}
          groups={PERMISSION_GROUPS}
          value={draft}
          savedValue={saved}
          height={520}
          onChange={(next) => {
            setJustSaved(false);
            setDraft(next);
          }}
          onSave={() => {
            setSaved(draft);
            setJustSaved(true);
          }}
          onRevert={() => setDraft(saved)}
          onCreateRole={createRole}
          onEditRole={(id) =>
            setRenaming({ id, label: roles.find((role) => role.id === id)?.label ?? "" })
          }
        />
      </div>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>Gán vai trò</CardTitle>
          <CardDescription>
            Một tài khoản có thể giữ nhiều vai trò; quyền hiệu lực là hợp các quyền của các vai trò
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-[var(--density-gap)]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="assign-user">Tài khoản</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="assign-user" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_USERS.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Vai trò</legend>
            {roles.map((role) => {
              const checkboxId = `assign-${userId}-${role.id}`;
              return (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={heldRoles.includes(role.id)}
                    onCheckedChange={(checked) => toggleAssigned(role.id, checked === true)}
                  />
                  <Label htmlFor={checkboxId} className="font-normal">
                    {role.label}
                  </Label>
                </div>
              );
            })}
          </fieldset>

          <p className="text-sm font-medium" role="status">
            Quyền hiệu lực: {effective.size} quyền
          </p>
        </CardContent>
      </Card>

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const label = renaming?.label.trim();
              if (renaming && label) {
                setRoles((list) =>
                  list.map((role) => (role.id === renaming.id ? { ...role, label } : role)),
                );
              }
              setRenaming(null);
            }}
          >
            <DialogHeader>
              <DialogTitle>Đổi tên vai trò</DialogTitle>
              <DialogDescription>Tên mới hiển thị trên cột của ma trận phân quyền.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role-name">Tên vai trò</Label>
              <Input
                id="role-name"
                value={renaming?.label ?? ""}
                onChange={(e) =>
                  setRenaming((current) => current && { ...current, label: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenaming(null)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!renaming?.label.trim()}>
                Lưu tên
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
