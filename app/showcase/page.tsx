import type { Metadata } from "next";

import { DashboardPage } from "./_parts/dashboard-page";

export const metadata: Metadata = { title: "Bảng điều khiển" };

export default function ShowcasePage() {
  return <DashboardPage />;
}
