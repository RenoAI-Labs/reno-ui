import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { DataGrid, selectionColumn } from "@/components/ui/data-grid";
import {
  PermissionMatrix,
  countChanges,
  togglePermission,
  type PermissionGrants,
  type PermissionGroup,
} from "@/components/ui/permission-matrix";
import { RowActions, splitRowActions, type RowAction } from "@/components/ui/row-actions";
import { SaveBar } from "@/components/ui/save-bar";
import { UserMenu } from "@/components/ui/user-menu";
import { createGridColumns, emptyGridState } from "@/lib/grid-state";

/**
 * The reno-specific contract of the admin layout primitives: the rules the
 * standard marks mandatory, held where a refactor cannot quietly drop them.
 */

beforeAll(() => {
  // jsdom has none of these, and Radix popovers and tooltips measure on mount.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 400 });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 800 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 400 });
});

const action = (key: string, extra: Partial<RowAction> = {}): RowAction => ({
  key,
  label: `Việc ${key}`,
  icon: <span aria-hidden>*</span>,
  onSelect: () => undefined,
  ...extra,
});

describe("RowActions: the common action is never behind two clicks", () => {
  it("shows every action inline, and no overflow menu, up to four", () => {
    const { rerender } = render(<RowActions actions={[action("a"), action("b"), action("c")]} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Thao tác khác" })).toBeNull();

    rerender(<RowActions actions={["a", "b", "c", "d"].map((key) => action(key))} />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "Thao tác khác" })).toBeNull();
  });

  it("keeps four inline and adds the ⋯ menu only when there are more", () => {
    render(<RowActions actions={["a", "b", "c", "d", "e", "f"].map((key) => action(key))} />);
    // Four inline plus the menu trigger.
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Thao tác khác" })).toBeInTheDocument();
    for (const key of ["a", "b", "c", "d"]) {
      expect(screen.getByRole("button", { name: `Việc ${key}` })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Việc e" })).toBeNull();
  });

  it("refuses more than four inline however many are asked for", () => {
    const actions = ["a", "b", "c", "d", "e", "f", "g"].map((key) => action(key));
    expect(splitRowActions(actions, 6).inline).toHaveLength(4);
    expect(splitRowActions(actions, 6).overflow).toHaveLength(3);
    expect(splitRowActions(actions, 0).inline).toHaveLength(1);
  });

  it("asks before running an action that has a confirmation", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <RowActions
        actions={[
          action("x", {
            destructive: true,
            onSelect,
            confirm: { title: "Xóa dòng này?", description: "Không thể hoàn tác." },
          }),
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Việc x" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByText("Xóa dòng này?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});

describe("BulkActionBar", () => {
  it("renders nothing while no row is selected", () => {
    const { container } = render(<BulkActionBar count={0} onClear={() => undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the count, the bulk buttons and a clear control", async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(
      <BulkActionBar count={3} onClear={onClear}>
        <button type="button">Xóa</button>
      </BulkActionBar>,
    );

    expect(screen.getByText("Đã chọn 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xóa" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bỏ chọn" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("offers every matching row only once the whole page is selected", async () => {
    const onAll = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <BulkActionBar
        count={10}
        noun="người"
        matchingTotal={240}
        pageFullySelected={false}
        onSelectAllMatching={onAll}
        onClear={() => undefined}
      />,
    );
    expect(screen.queryByText(/khớp bộ lọc/)).toBeNull();

    rerender(
      <BulkActionBar
        count={10}
        noun="người"
        matchingTotal={240}
        pageFullySelected
        onSelectAllMatching={onAll}
        onClear={() => undefined}
      />,
    );
    expect(screen.getByText("Đã chọn 10 người trên trang này.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Chọn tất cả 240 người khớp bộ lọc" }));
    expect(onAll).toHaveBeenCalledOnce();
  });
});

describe("DataGrid reports its view for the bulk bar", () => {
  const columns = createGridColumns<{ id: string; name: string }>((col) => [
    col.accessor("name", { header: "Tên" }),
  ]);
  const rows = Array.from({ length: 25 }, (_, i) => ({ id: `r${i}`, name: `Dòng ${i}` }));

  it("says which rows are on the page and how many match", () => {
    const onViewChange = vi.fn();
    render(
      <DataGrid
        columns={columns}
        data={rows}
        state={emptyGridState(10)}
        onStateChange={() => undefined}
        getRowId={(row) => row.id}
        mode="client"
        onViewChange={onViewChange}
      />,
    );

    const view = onViewChange.mock.calls.at(-1)![0];
    expect(view.total).toBe(25);
    expect(view.pageRowIds).toEqual(rows.slice(0, 10).map((row) => row.id));
  });
});

describe("the select column's header checkbox selects the page", () => {
  const columns = createGridColumns<{ id: string; name: string }>((col) => [
    selectionColumn<{ id: string; name: string }>(),
    col.accessor("name", { header: "Tên" }),
  ]);
  const rows = Array.from({ length: 25 }, (_, i) => ({ id: `r${i}`, name: `Dòng ${i}` }));

  it("selects the ten rows on screen, not all twenty-five", async () => {
    const user = userEvent.setup();
    let latest = emptyGridState(10);
    function Harness() {
      const [state, setState] = React.useState(latest);
      latest = state;
      return (
        <DataGrid
          columns={columns}
          data={rows}
          state={state}
          onStateChange={(updater) => setState(updater)}
          getRowId={(row) => row.id}
          mode="client"
        />
      );
    }
    render(<Harness />);

    await user.click(screen.getByRole("checkbox", { name: "Chọn tất cả dòng trên trang" }));
    expect(Object.keys(latest.rowSelection)).toHaveLength(10);
  });
});

describe("PermissionMatrix", () => {
  const groups: PermissionGroup[] = [
    {
      id: "acc",
      label: "Tài khoản",
      rows: [
        { id: "acc.read", label: "Xem" },
        { id: "acc.write", label: "Tạo và sửa", scope: "own" },
        { id: "acc.all", label: "Toàn quyền", implies: ["acc.read", "acc.write"] },
      ],
    },
  ];
  const roles = [
    { id: "a", label: "Admin" },
    { id: "b", label: "Giảng viên" },
  ];

  it("ticking the implying row ticks what it implies", () => {
    const next = togglePermission({ a: [] }, groups, "a", "acc.all");
    expect(new Set(next.a)).toEqual(new Set(["acc.all", "acc.read", "acc.write"]));
  });

  it("clearing an implied row clears whatever implied it", () => {
    const full: PermissionGrants = { a: ["acc.all", "acc.read", "acc.write"] };
    const next = togglePermission(full, groups, "a", "acc.read");
    expect(new Set(next.a)).toEqual(new Set(["acc.write"]));
  });

  it("counts cells that differ from the saved grants, in both directions", () => {
    expect(countChanges({ a: ["x"] }, { a: ["x"] })).toBe(0);
    expect(countChanges({ a: ["x"] }, { a: ["y"] })).toBe(2);
    expect(countChanges({}, { b: ["x", "y"] })).toBe(2);
  });

  it("toggling a cell moves the dirty counter, and reverting resets it", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [saved, setSaved] = React.useState<PermissionGrants>({ a: [], b: [] });
      const [draft, setDraft] = React.useState(saved);
      return (
        <PermissionMatrix
          roles={roles}
          groups={groups}
          value={draft}
          savedValue={saved}
          onChange={setDraft}
          onSave={() => setSaved(draft)}
          onRevert={() => setDraft(saved)}
        />
      );
    }
    render(<Harness />);

    const save = () => screen.getByRole("button", { name: /Lưu tất cả thay đổi/ });
    expect(save()).toBeDisabled();
    expect(save()).toHaveTextContent("Lưu tất cả thay đổi (0)");

    await user.click(screen.getByRole("checkbox", { name: "Admin: Tài khoản — Xem" }));
    expect(save()).toHaveTextContent("Lưu tất cả thay đổi (1)");
    expect(save()).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(save()).toHaveTextContent("Lưu tất cả thay đổi (0)");
  });

  it("names every cell by role and permission, and badges the scoped row", () => {
    render(
      <PermissionMatrix
        roles={roles}
        groups={groups}
        value={{}}
        savedValue={{}}
        onChange={() => undefined}
        onSave={() => undefined}
        onRevert={() => undefined}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Giảng viên: Tài khoản — Tạo và sửa" })).toBeInTheDocument();
    expect(screen.getByText("Phạm vi khác")).toBeInTheDocument();
    // Real header cells, so a screen reader announces column and row.
    expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toContain("Quyền");
    expect(screen.getByRole("rowheader", { name: /Xem/ })).toBeInTheDocument();
  });
});

describe("SaveBar", () => {
  it("is disabled, not hidden, with nothing to save", () => {
    render(<SaveBar dirtyCount={0} onRevert={() => undefined} onSave={() => undefined} />);
    expect(screen.getByRole("button", { name: "Hoàn tác" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Lưu tất cả thay đổi \(0\)/ })).toBeDisabled();
  });

  it("shows the dirty count on the save button", () => {
    render(<SaveBar dirtyCount={3} onRevert={() => undefined} onSave={() => undefined} />);
    expect(screen.getByRole("button", { name: "Lưu tất cả thay đổi (3)" })).toBeEnabled();
  });
});

describe("UserMenu keeps the order the standard fixes", () => {
  it("lists identity, usage, account items, language, appearance, help and sign-out in that order", async () => {
    const user = userEvent.setup();
    render(
      <UserMenu
        user={{ name: "Nguyễn Thu Hà", email: "ha@congty.vn", initials: "TH", plan: "Cao Cấp" }}
        usage={{ label: "Điểm còn lại kỳ này", remaining: 2155, total: 4300, caption: "Gia hạn 12/10/2026" }}
        items={["Hồ sơ cá nhân", "Cài đặt tài khoản", "Gói và thanh toán", "Lịch sử đăng nhập"].map(
          (label) => ({ key: label, label, icon: <span aria-hidden />, onSelect: () => undefined }),
        )}
        language={{
          value: "vi",
          options: [{ value: "vi", label: "Tiếng Việt" }],
          onChange: () => undefined,
        }}
        theme={{ value: "system", onChange: () => undefined }}
        onHelp={() => undefined}
        onSignOut={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Mở menu tài khoản" }));
    const menu = document.querySelector<HTMLElement>('[data-slot="user-menu"]')!;
    expect(menu).toBeTruthy();

    const order = [
      "Nguyễn Thu Hà",
      "ha@congty.vn",
      "Cao Cấp",
      "Điểm còn lại kỳ này",
      "Gia hạn 12/10/2026",
      "Hồ sơ cá nhân",
      "Cài đặt tài khoản",
      "Gói và thanh toán",
      "Lịch sử đăng nhập",
      "Ngôn ngữ",
      "Giao diện",
      "Trợ giúp và hỗ trợ",
      "Đăng xuất",
    ];
    const nodes = order.map((text) => within(menu).getByText(text));
    for (let i = 1; i < nodes.length; i += 1) {
      // DOCUMENT_POSITION_FOLLOWING: the next entry comes after the previous one.
      expect(nodes[i - 1]!.compareDocumentPosition(nodes[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }

    // Sign-out is the destructive colour.
    expect(within(menu).getByRole("button", { name: "Đăng xuất" }).className).toContain("text-destructive");
  });

  it("drops the usage card for a product with no credits, and moves nothing else", async () => {
    const user = userEvent.setup();
    render(
      <UserMenu
        user={{ name: "A", email: "a@b.c", initials: "A" }}
        items={[{ key: "p", label: "Hồ sơ cá nhân", icon: null, onSelect: () => undefined }]}
        onSignOut={() => undefined}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Mở menu tài khoản" }));
    expect(document.querySelector('[data-slot="user-menu-usage"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });
});
