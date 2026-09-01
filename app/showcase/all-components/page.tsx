import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { DEMOS } from "@/app/lib/demo-index.generated";
import { groupedUiItems } from "@/app/lib/registry-catalog";
import { EdgeStates } from "../_parts/edge-states";
import { ShowcasePageHeader } from "../_parts/showcase-page-header";

export const metadata: Metadata = {
  title: "Tất cả component",
  description:
    "Kitchen sink: mọi primitive trong registry render trên cùng một trang, để soát bằng mắt qua 4 preset và light/dark.",
};

/**
 * Every primitive on one page.
 *
 * The list is derived from `registry.json`, not written here. That is the whole
 * point: registering a component and forgetting to add it to the showcase is
 * impossible, and a component registered without a demo shows up below as a
 * visible gap rather than silently missing from visual review.
 *
 * The dashboard at `/showcase` is the opposite exercise — it has to look like a
 * product. This page has to be exhaustive, which is why they are separate.
 */
export default function AllComponentsPage() {
  const groups = groupedUiItems();
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const missing = groups.flatMap((group) =>
    group.items.filter((item) => !DEMOS[item.name]).map((item) => item.name),
  );

  return (
    <>
      <ShowcasePageHeader
        title="Tất cả component"
        description={`${total} primitive, sinh tự động từ registry.json`}
        backHref="/showcase"
        backLabel="Dashboard"
      />

      <main className="flex flex-col gap-10 px-4 py-8">
        <nav className="flex flex-wrap gap-2" aria-label="Nhóm component">
          {groups.map((group) => (
            <a
              key={group.group}
              href={`#${group.group}`}
              className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {group.group} · {group.items.length}
            </a>
          ))}
        </nav>

        {missing.length > 0 ? (
          <p className="rounded-md border border-warning bg-warning/10 px-3 py-2 text-sm">
            Thiếu demo cho: {missing.join(", ")}. Thêm{" "}
            <code className="font-mono">registry/reno/examples/&lt;tên&gt;-demo.tsx</code> rồi chạy{" "}
            <code className="font-mono">npm run demos:generate</code>.
          </p>
        ) : null}

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Trạng thái biên</h2>
          <p className="text-sm text-muted-foreground">
            Lỗi, rỗng, đang tải, vô hiệu hoá — những trạng thái mà một trang chỉ
            đi đường thành công sẽ không bao giờ chạm tới.
          </p>
          <EdgeStates />
        </section>

        {groups.map((group) => (
          <section key={group.group} id={group.group} className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              {group.group}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {group.items.length} component
              </span>
            </h2>

            <div className="grid gap-4 xl:grid-cols-2">
              {group.items.map((item) => {
                const Demo = DEMOS[item.name];
                return (
                  <article
                    key={item.name}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
                  >
                    <header className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <Badge variant="outline" className="font-mono">
                        {item.name}
                      </Badge>
                    </header>
                    {Demo ? (
                      <Demo />
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có demo.</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
