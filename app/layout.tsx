import type { Metadata } from "next";

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
        {/*
          No chrome here on purpose. The docs route group supplies the header and
          the reading-width container; /showcase is a full-bleed app screen that
          owns the whole viewport and brings its own. A single shared wrapper
          could not serve both — a nested layout cannot widen a parent container.
        */}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
