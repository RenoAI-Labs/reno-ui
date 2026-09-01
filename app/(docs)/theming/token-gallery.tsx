import { Button } from "@/components/ui/button";

const SURFACE_TOKENS = [
  { name: "background", fg: "foreground" },
  { name: "card", fg: "card-foreground" },
  { name: "muted", fg: "muted-foreground" },
  { name: "primary", fg: "primary-foreground" },
  { name: "secondary", fg: "secondary-foreground" },
  { name: "destructive", fg: "destructive-foreground" },
  { name: "success", fg: "success-foreground" },
  { name: "warning", fg: "warning-foreground" },
  { name: "info", fg: "info-foreground" },
];

const DENSITY_TOKENS = [
  "density-control-height",
  "density-row-height",
  "density-cell-padding-x",
  "density-gap",
  "density-font-size",
  "radius",
];

/**
 * Static gallery — no client state. Every swatch reads a CSS variable, so the
 * whole thing re-themes from the [data-preset] attribute alone. That is the
 * mechanism a consuming project gets, demonstrated rather than described.
 */
export function TokenGallery() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Semantic color</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACE_TOKENS.map((token) => (
            <div
              key={token.name}
              className="flex flex-col gap-1 rounded-lg border border-border p-4"
              style={{
                background: `var(--${token.name})`,
                color: `var(--${token.fg})`,
              }}
            >
              <span className="font-mono text-xs opacity-70">--{token.name}</span>
              <span className="text-sm font-medium">Văn bản mẫu Aa</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Brand ramp</h2>
        <p className="text-sm text-muted-foreground">
          Primitive token. Component không bao giờ đọc trực tiếp tầng này — chúng
          chỉ đọc semantic token ở trên.
        </p>
        <div className="flex overflow-hidden rounded-lg border border-border">
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((stop) => (
            <div
              key={stop}
              className="flex h-16 flex-1 items-end justify-center pb-1 font-mono text-[10px]"
              style={{
                background: `var(--reno-brand-${stop})`,
                color: stop >= 500 ? "var(--reno-brand-50)" : "var(--reno-brand-950)",
              }}
            >
              {stop}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Density</h2>
        <p className="text-sm text-muted-foreground">
          ERP nén chặt hơn e-learning. Cùng một component, khác giá trị token.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left">
                <th className="px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)] font-medium">
                  Token
                </th>
                <th className="px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)] font-medium">
                  Giá trị hiện tại
                </th>
              </tr>
            </thead>
            <tbody>
              {DENSITY_TOKENS.map((token) => (
                <tr
                  key={token}
                  className="h-[var(--density-row-height)] border-b border-border last:border-0"
                >
                  <td className="px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)] font-mono text-xs">
                    --{token}
                  </td>
                  <td className="px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)]">
                    <span
                      className="inline-block h-3 rounded-sm bg-primary align-middle"
                      style={{ width: `var(--${token})` }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-[var(--density-gap)] rounded-lg border border-border bg-card p-4">
          <Button size="sm">Nhỏ</Button>
          <Button>Mặc định</Button>
          <Button size="lg">Lớn</Button>
          <Button variant="outline">Viền</Button>
          <input
            className="h-[var(--density-control-height)] rounded-md border border-input bg-background px-[var(--density-control-px)] text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Input cùng chiều cao"
          />
        </div>
      </section>
    </div>
  );
}
