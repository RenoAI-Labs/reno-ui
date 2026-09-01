import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CodeBlock } from "@/app/code-block";
import { DEMOS } from "@/app/lib/demo-index.generated";
import { UI_ITEMS, getItem, installCommand } from "@/app/lib/registry-catalog";

export function generateStaticParams() {
  return UI_ITEMS.map((item) => ({ slug: item.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) return {};
  return { title: item.title, description: item.description };
}

/**
 * One page shape for every primitive. Content comes from `registry.json` and the
 * generated demo index, so adding a component to the registry and dropping a
 * demo file is all it takes to get a docs page — no page to write by hand, and
 * nothing to forget to update.
 */
export default async function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item || item.type !== "registry:ui") notFound();

  const Demo = DEMOS[slug];

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
        <p className="text-muted-foreground">{item.description}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Cài đặt
        </h2>
        <CodeBlock code={installCommand(item.name)} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Demo
        </h2>
        <div className="rounded-lg border border-border bg-card p-6">
          {Demo ? (
            <Demo />
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa có demo. Thêm{" "}
              <code className="font-mono">
                registry/reno/examples/{slug}-demo.tsx
              </code>{" "}
              rồi chạy <code className="font-mono">npm run demos:generate</code>.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <DependencyList title="npm dependencies" items={item.dependencies} />
        <DependencyList
          title="Registry dependencies"
          items={item.registryDependencies}
        />
      </section>
    </article>
  );
}

function DependencyList({ title, items }: { title: string; items?: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {items?.length ? (
        <ul className="flex flex-wrap gap-2">
          {items.map((dep) => (
            <li
              key={dep}
              className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs"
            >
              {dep}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Không có</p>
      )}
    </div>
  );
}
