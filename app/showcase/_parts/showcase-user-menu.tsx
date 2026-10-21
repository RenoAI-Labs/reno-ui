"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcon, HistoryIcon, SettingsIcon, UserCogIcon } from "lucide-react";

import { UserMenu, type UserMenuTheme } from "@/components/ui/user-menu";
import { useTheme } from "@/app/theme-provider";
import { CURRENT_USER } from "./mock-admin-data";
import { PROFILE_HREF } from "./showcase-nav";

/**
 * The avatar menu wired to the showcase: navigation through the router, the
 * theme row through the docs site's theme provider.
 *
 * `Auto` is a preference the provider has no concept of — it stores light or
 * dark — so it is held here and resolved against the system setting, and kept in
 * step with it while selected.
 */
export function ShowcaseUserMenu() {
  const router = useRouter();
  const { mode, setMode } = useTheme();
  const [preference, setPreference] = React.useState<UserMenuTheme>(mode);
  const [language, setLanguage] = React.useState("vi");

  React.useEffect(() => {
    if (preference !== "system") return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setMode(query.matches ? "dark" : "light");
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [preference, setMode]);

  const choose = (value: UserMenuTheme) => {
    setPreference(value);
    if (value !== "system") setMode(value);
  };

  const go = (hash = "") => () => router.push(`${PROFILE_HREF}${hash}`);

  return (
    <UserMenu
      user={{
        name: CURRENT_USER.name,
        email: CURRENT_USER.email,
        initials: CURRENT_USER.initials,
        plan: CURRENT_USER.plan,
      }}
      usage={{
        label: "Điểm còn lại kỳ này",
        remaining: 2155,
        total: 4300,
        caption: "Gia hạn 12/10/2026",
        action: (
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => router.push("/showcase/settings?tab=billing")}
          >
            Nạp thêm điểm
          </button>
        ),
      }}
      items={[
        { key: "profile", label: "Hồ sơ cá nhân", icon: <UserCogIcon />, onSelect: go() },
        { key: "account", label: "Cài đặt tài khoản", icon: <SettingsIcon />, onSelect: () => router.push("/showcase/settings") },
        { key: "billing", label: "Gói và thanh toán", icon: <CreditCardIcon />, onSelect: () => router.push("/showcase/settings?tab=billing") },
        { key: "history", label: "Lịch sử đăng nhập", icon: <HistoryIcon />, onSelect: go("#lich-su-dang-nhap") },
      ]}
      language={{
        value: language,
        options: [
          { value: "vi", label: "Tiếng Việt", flag: <span aria-hidden>🇻🇳</span> },
          { value: "en", label: "English", flag: <span aria-hidden>🇬🇧</span> },
        ],
        onChange: setLanguage,
      }}
      theme={{ value: preference, onChange: choose }}
      onHelp={() => router.push("/components")}
      onSignOut={() => router.push("/")}
    />
  );
}
