import type { Metadata } from "next";

import { SiteHeader } from "@/app/site-header";
import { ThemeProvider } from "@/app/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "reno-ui",
    template: "%s · reno-ui",
  },
  description:
    "Self-hosted shadcn registry for multi-domain projects: design tokens, primitives, DataGrid and blocks. Install with one command, hand over with zero dependency on us.",
  metadataBase: new URL("https://ui.reno.ai.vn"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `suppressHydrationWarning` because ThemeProvider writes data-preset/class
    // onto <html> before paint to avoid a flash of the wrong theme.
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
