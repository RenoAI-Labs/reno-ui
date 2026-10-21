import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ALL_NAV_ITEMS,
  ALL_SHELL_HREFS,
  FAVOURITES,
  FOOTER_LINKS,
  NAV_GROUPS,
  isActive,
  pathOf,
} from "@/app/showcase/_parts/showcase-nav";

/**
 * The parts of docs/admin-layout-standard.md that a machine can hold down: the
 * rule that no menu item exists without a page, and that the document the
 * harness pins is versioned and reachable from the docs a reader starts at.
 */

const ROOT = join(import.meta.dirname, "..");

/** `/showcase/reports` -> app/showcase/reports/page.tsx; `/showcase` -> app/showcase/page.tsx. */
function pageFile(href: string) {
  return join(ROOT, "app", pathOf(href), "page.tsx");
}

describe("the showcase navigation has no orphan items", () => {
  it("points every sidebar, favourite, footer and account entry at an existing page", () => {
    const orphans = ALL_SHELL_HREFS.filter(
      (href) => pathOf(href).startsWith("/showcase") && !existsSync(pageFile(href)),
    );
    expect(orphans).toEqual([]);
  });

  it("points external-to-showcase entries at a docs route that exists", () => {
    // `/` is the documentation home, `app/(docs)/page.tsx`.
    expect(existsSync(join(ROOT, "app/(docs)/page.tsx"))).toBe(true);
  });

  it("keeps the standard's five pages and drops the items that had none", () => {
    expect(ALL_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Bảng điều khiển",
      "Báo cáo",
      "Nhân viên",
      "Cấu hình",
    ]);
    // Profile is the fifth page; it hangs off the avatar menu, not the sidebar.
    expect(existsSync(pageFile("/showcase/profile"))).toBe(true);
    for (const removed of ["Phòng ban", "Nghỉ phép", "Bảng lương", "Kho tài liệu"]) {
      expect(ALL_NAV_ITEMS.map((item) => item.label)).not.toContain(removed);
    }
  });

  it("uses one key per entry, so the sidebar and the palette cannot collide", () => {
    const keys = [...ALL_NAV_ITEMS, ...FAVOURITES, ...FOOTER_LINKS].map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(NAV_GROUPS.every((group) => group.items.length > 0)).toBe(true);
  });

  it("marks the dashboard active only on its own path", () => {
    expect(isActive("/showcase", "/showcase")).toBe(true);
    expect(isActive("/showcase/reports", "/showcase")).toBe(false);
    expect(isActive("/showcase/settings", "/showcase/settings?tab=roles")).toBe(true);
  });
});

describe("docs/admin-layout-standard.md", () => {
  const standard = readFileSync(join(ROOT, "docs/admin-layout-standard.md"), "utf8");

  it("carries its version and a changelog", () => {
    expect(standard).toContain("`admin-layout-standard v1`");
    expect(standard).toMatch(/^## Changelog/m);
  });

  it("states both halves of the contract", () => {
    expect(standard).toMatch(/^## 10\. What a project may vary, and what it may not/m);
    expect(standard).toContain("**Per project (through tokens or props):**");
    expect(standard).toContain("**Never varies (positions and functions):**");
  });

  it("is linked from the README and the component inventory", () => {
    expect(readFileSync(join(ROOT, "README.md"), "utf8")).toContain("docs/admin-layout-standard.md");
    expect(readFileSync(join(ROOT, "docs/ui-components.md"), "utf8")).toContain(
      "admin-layout-standard.md",
    );
  });
});
