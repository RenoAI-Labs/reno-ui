import { SiteHeader } from "@/app/site-header";

/**
 * Documentation chrome: site header plus a reading-width column. Everything
 * under `(docs)` renders inside it; `/showcase` deliberately sits outside the
 * group so it can use the full viewport.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </>
  );
}
