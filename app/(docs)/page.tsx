import Link from "next/link";

import { CodeBlock } from "@/app/code-block";
import { REGISTRY_HOMEPAGE, THEME_ITEMS, UI_ITEMS } from "@/app/lib/registry-catalog";
import { Button } from "@/components/ui/button";

const CONSUMER_CONFIG = `{
  "registries": {
    "@reno": "${REGISTRY_HOMEPAGE}/r/{name}.json"
  }
}`;

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Thư viện UI đa domain cho dự án outsource
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          reno-ui là registry shadcn tự host. Component được ghi thẳng vào repo dự
          án dưới dạng file <code className="font-mono">.tsx</code> — không có
          runtime dependency nào trỏ ngược về hạ tầng của chúng tôi. Bàn giao
          xong, khách sở hữu toàn bộ source.
        </p>
        <div className="flex flex-wrap gap-[var(--density-gap)]">
          <Button asChild>
            <Link href="/components">Xem component</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/theming">Thử theme preset</Link>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Bắt đầu</h2>
        <p className="text-sm text-muted-foreground">
          Thêm namespace <code className="font-mono">@reno</code> vào{" "}
          <code className="font-mono">components.json</code> của dự án:
        </p>
        <CodeBlock code={CONSUMER_CONFIG} />
        <p className="text-sm text-muted-foreground">Rồi cài bất kỳ item nào:</p>
        <CodeBlock code={"npx shadcn@latest add @reno/theme-admin\nnpx shadcn@latest add @reno/button"} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Primitive" value={String(UI_ITEMS.length)} />
        <Stat label="Theme preset" value={String(THEME_ITEMS.length)} />
        <Stat label="Runtime dependency" value="0" />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-[var(--density-cell-padding-x)]">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
