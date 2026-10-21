"use client";

import * as React from "react";
import { CreditCardIcon, RotateCcwClockIcon, SettingsIcon, UserCogIcon } from "lucide-react";

import { UserMenu, type UserMenuTheme } from "@/components/ui/user-menu";

export default function UserMenuDemo() {
  const [theme, setTheme] = React.useState<UserMenuTheme>("system");
  const [language, setLanguage] = React.useState("vi");

  return (
    <UserMenu
      user={{ name: "Nguyễn Thu Hà", email: "ha.nguyen@congty.vn", initials: "TH", plan: "Cao Cấp" }}
      usage={{ label: "Điểm còn lại kỳ này", remaining: 2155, total: 4300, caption: "Gia hạn 12/10/2026" }}
      items={[
        { key: "profile", label: "Hồ sơ cá nhân", icon: <UserCogIcon />, onSelect: () => undefined },
        { key: "account", label: "Cài đặt tài khoản", icon: <SettingsIcon />, onSelect: () => undefined },
        { key: "billing", label: "Gói và thanh toán", icon: <CreditCardIcon />, onSelect: () => undefined },
        { key: "history", label: "Lịch sử đăng nhập", icon: <RotateCcwClockIcon />, onSelect: () => undefined },
      ]}
      language={{
        value: language,
        options: [
          { value: "vi", label: "Tiếng Việt" },
          { value: "en", label: "English" },
        ],
        onChange: setLanguage,
      }}
      theme={{ value: theme, onChange: setTheme }}
      onHelp={() => undefined}
      onSignOut={() => undefined}
    />
  );
}
