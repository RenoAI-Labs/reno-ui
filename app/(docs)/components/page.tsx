import Link from "next/link";
import type { Metadata } from "next";

import { UI_ITEMS, groupedUiItems } from "@/app/lib/registry-catalog";

export const metadata: Metadata = { title: "Component" };

export default function ComponentsIndexPage() {
  const groups = groupedUiItems();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Component</h1>
        <p className="text-muted-foreground">
          {UI_ITEMS.length} primitive, mỗi cái cài lẻ được bằng một lệnh. Mọi
          component chỉ đọc semantic token — đổi preset là đổi toàn bộ giao diện.
        </p>
      </div>

      {groups.map(({ group, items }) => (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {group} <span className="tabular-nums">({items.length})</span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.name}>
                <Link
                  href={`/components/${item.name}`}
                  className="flex h-full flex-col gap-1 rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
