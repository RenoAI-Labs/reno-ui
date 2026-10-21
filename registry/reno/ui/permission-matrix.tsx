"use client";

import * as React from "react";
import { PencilIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/**
 * Roles as columns, permissions as rows, one checkbox per cell.
 *
 * The permission model of the admin layout standard (§8.1) and of the harness
 * baseline: a role is a column, a permission is a row, and an account holds one
 * or more roles, so what an account may do is the union of its roles' columns.
 * The matrix edits roles; it knows nothing about accounts.
 *
 * Rows are grouped by resource under a group header row. A row may `imply` other
 * rows — "Toàn quyền" implies Xem, Tạo và sửa and Xóa — and the implication is
 * kept true in both directions: ticking the implying row ticks the implied ones,
 * and clearing an implied row clears whatever implied it. A row carrying a
 * `scope` shows the small "Phạm vi khác" badge.
 *
 * Controlled. `value` is the draft and `savedValue` is what is stored; the
 * number in "Lưu tất cả thay đổi (n)" is the count of cells where they differ,
 * computed by `countChanges`. Both that and `togglePermission` are exported pure
 * functions so the rules can be tested without rendering a table.
 *
 * The table keeps its header row and its first column sticky, every cell has a
 * visible focus ring and an accessible name that says which role and which
 * permission it is, and the headers are real `th` elements with a scope so a
 * screen reader announces the column and the row of the cell it lands on.
 */

export type PermissionRole = { id: string; label: string };

export type PermissionRow = {
  id: string;
  label: string;
  /** Shows the scope badge: the permission is limited by own / team / other. */
  scope?: string;
  /** Rows granted along with this one. */
  implies?: string[];
};

export type PermissionGroup = { id: string; label: string; rows: PermissionRow[] };

/** role id -> ids of the rows the role holds. */
export type PermissionGrants = Record<string, string[]>;

export function togglePermission(
  grants: PermissionGrants,
  groups: PermissionGroup[],
  roleId: string,
  rowId: string,
): PermissionGrants {
  const rows = groups.flatMap((group) => group.rows);
  const held = new Set(grants[roleId] ?? []);

  if (held.has(rowId)) {
    held.delete(rowId);
    // Clearing a row clears every row that implied it: "Toàn quyền" cannot stay
    // ticked once "Xóa" is gone.
    for (const row of rows) if (row.implies?.includes(rowId)) held.delete(row.id);
  } else {
    held.add(rowId);
    for (const implied of rows.find((row) => row.id === rowId)?.implies ?? []) held.add(implied);
  }

  return { ...grants, [roleId]: [...held] };
}

/** Cells that differ between the stored grants and the draft. */
export function countChanges(saved: PermissionGrants, draft: PermissionGrants): number {
  let changes = 0;
  for (const roleId of new Set([...Object.keys(saved), ...Object.keys(draft)])) {
    const before = new Set(saved[roleId] ?? []);
    const after = new Set(draft[roleId] ?? []);
    for (const id of before) if (!after.has(id)) changes += 1;
    for (const id of after) if (!before.has(id)) changes += 1;
  }
  return changes;
}

export type PermissionMatrixLabels = {
  caption: string;
  permission: string;
  createRole: string;
  revert: string;
  save: (count: number) => string;
  editRole: (role: string) => string;
  scopeBadge: string;
  cell: (role: string, permission: string) => string;
};

export const defaultPermissionMatrixLabels: PermissionMatrixLabels = {
  caption: "Ma trận phân quyền: vai trò theo cột, quyền theo hàng",
  permission: "Quyền",
  createRole: "Tạo vai trò",
  revert: "Hoàn tác",
  save: (count) => `Lưu tất cả thay đổi (${count})`,
  editRole: (role) => `Sửa vai trò ${role}`,
  scopeBadge: "Phạm vi khác",
  cell: (role, permission) => `${role}: ${permission}`,
};

export type PermissionMatrixProps = {
  roles: PermissionRole[];
  groups: PermissionGroup[];
  value: PermissionGrants;
  savedValue: PermissionGrants;
  onChange: (next: PermissionGrants) => void;
  onSave: () => void;
  onRevert: () => void;
  onCreateRole?: () => void;
  onEditRole?: (roleId: string) => void;
  /** Height of the scroll viewport. The sticky header needs a bounded height. */
  height?: number | string;
  labels?: Partial<PermissionMatrixLabels>;
  className?: string;
};

export function PermissionMatrix({
  roles,
  groups,
  value,
  savedValue,
  onChange,
  onSave,
  onRevert,
  onCreateRole,
  onEditRole,
  height = 480,
  labels: overrides,
  className,
}: PermissionMatrixProps) {
  const labels = { ...defaultPermissionMatrixLabels, ...overrides };
  const dirty = countChanges(savedValue, value);
  const columns = roles.length + 1;

  return (
    <div data-slot="permission-matrix" className={cn("flex flex-col gap-[var(--density-gap)]", className)}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCreateRole ? (
          <Button variant="outline" size="sm" className="me-auto" onClick={onCreateRole}>
            <PlusIcon />
            {labels.createRole}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" disabled={dirty === 0} onClick={onRevert}>
          {labels.revert}
        </Button>
        <Button size="sm" disabled={dirty === 0} onClick={onSave}>
          {labels.save(dirty)}
        </Button>
      </div>

      <div
        className="relative overflow-auto rounded-lg border border-border"
        style={{ maxHeight: height }}
      >
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{labels.caption}</caption>
          <thead className="sticky top-0 z-20">
            <tr>
              <th
                scope="col"
                className="sticky start-0 z-30 min-w-56 border-b border-e border-border bg-muted px-3 py-2 text-start font-medium"
              >
                {labels.permission}
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  scope="col"
                  className="min-w-32 border-b border-border bg-muted px-3 py-2 text-center font-medium"
                >
                  <span className="inline-flex items-center gap-1">
                    {role.label}
                    {onEditRole ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        aria-label={labels.editRole(role.label)}
                        onClick={() => onEditRole(role.id)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {groups.map((group) => (
            <tbody key={group.id}>
              <tr>
                <th
                  scope="rowgroup"
                  colSpan={columns}
                  className="sticky start-0 border-b border-border bg-secondary px-3 py-1.5 text-start text-xs font-semibold uppercase tracking-wide text-secondary-foreground"
                >
                  {group.label}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.id} className="hover:bg-accent/40">
                  <th
                    scope="row"
                    className="sticky start-0 z-10 border-b border-e border-border bg-background px-3 py-2 text-start font-normal"
                  >
                    <span className="flex items-center gap-2">
                      {row.label}
                      {row.scope ? (
                        <Badge variant="outline" className="text-[0.625rem] uppercase">
                          {labels.scopeBadge}
                        </Badge>
                      ) : null}
                    </span>
                  </th>
                  {roles.map((role) => (
                    <td key={role.id} className="border-b border-border px-3 py-2 text-center">
                      <Checkbox
                        checked={(value[role.id] ?? []).includes(row.id)}
                        aria-label={labels.cell(role.label, `${group.label} — ${row.label}`)}
                        onCheckedChange={() =>
                          onChange(togglePermission(value, groups, role.id, row.id))
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
