import type { Metadata } from "next";

import { PerfHarness } from "@/app/(docs)/perf/data-grid/perf-harness";

export const metadata: Metadata = {
  title: "DataGrid benchmark",
  description: "Đo scroll 10k dòng client-mode với virtualization.",
};

export default function DataGridPerfPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          DataGrid — benchmark
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Client mode, 10.000 dòng, virtualization bật. Đây là đường đi khác với
          demo ở trang component (server mode, 25 dòng/trang, không cần ảo hoá).
          Bấm &ldquo;Đo FPS&rdquo; rồi cuộn liên tục trong 5 giây.
        </p>
      </header>
      <PerfHarness />
    </div>
  );
}
