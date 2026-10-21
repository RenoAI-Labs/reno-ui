import * as React from "react";
import type { Metadata } from "next";

import { SettingsPage } from "../_parts/settings-page";

export const metadata: Metadata = { title: "Cấu hình" };

export default function ShowcaseSettingsPage() {
  // `SettingsPage` reads `useSearchParams`, which needs a Suspense boundary to prerender.
  return (
    <React.Suspense>
      <SettingsPage />
    </React.Suspense>
  );
}
