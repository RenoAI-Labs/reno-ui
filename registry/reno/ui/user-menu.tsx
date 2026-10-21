"use client";

import * as React from "react";
import { ChevronDownIcon, CircleQuestionMarkIcon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QuotaWidget, type QuotaWidgetProps } from "@/components/ui/quota-widget";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

/**
 * The popover under the header avatar.
 *
 * Content and order are fixed by the admin layout standard (§3), and the
 * component's structure is what fixes them — there is no `children` slot to
 * reorder things through:
 *
 *   1. identity: avatar, name, email, plan badge
 *   2. usage card (optional — a product with no credits omits it)
 *   3. account items
 *   4. language, theme (Sáng / Tối / Auto), help
 *   5. sign out, in the destructive colour
 *
 * It is a popover, not a dropdown menu, because items 2 and 4 are not menu
 * items: a progress card and a segmented control have no place in a `menu` role.
 * The account items are plain buttons in a labelled group.
 *
 * Navigation is a callback (`onSelect`) rather than an `href` so the primitive
 * stays framework-neutral; the project wires `router.push` or a link.
 */
export type UserMenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
};

export type UserMenuTheme = "light" | "dark" | "system";

export type UserMenuLanguage = {
  value: string;
  options: { value: string; label: string; flag?: React.ReactNode }[];
  onChange: (value: string) => void;
};

export type UserMenuLabels = {
  trigger: string;
  accountGroup: string;
  language: string;
  appearance: string;
  light: string;
  dark: string;
  system: string;
  help: string;
  signOut: string;
};

export const defaultUserMenuLabels: UserMenuLabels = {
  trigger: "Mở menu tài khoản",
  accountGroup: "Tài khoản",
  language: "Ngôn ngữ",
  appearance: "Giao diện",
  light: "Sáng",
  dark: "Tối",
  system: "Auto",
  help: "Trợ giúp và hỗ trợ",
  signOut: "Đăng xuất",
};

export type UserMenuProps = {
  user: { name: string; email: string; initials: string; imageSrc?: string; plan?: string };
  /** Omit when the product has no plans or credits. */
  usage?: Pick<QuotaWidgetProps, "label" | "remaining" | "total" | "caption" | "action" | "format">;
  /** "Hồ sơ cá nhân", "Cài đặt tài khoản", "Gói và thanh toán", "Lịch sử đăng nhập". */
  items: UserMenuItem[];
  language?: UserMenuLanguage;
  theme?: { value: UserMenuTheme; onChange: (value: UserMenuTheme) => void };
  /** The "Trợ giúp và hỗ trợ" row. */
  onHelp?: () => void;
  onSignOut: () => void;
  labels?: Partial<UserMenuLabels>;
  className?: string;
};

const rowClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

export function UserMenu({
  user,
  usage,
  items,
  language,
  theme,
  onHelp,
  onSignOut,
  labels: overrides,
  className,
}: UserMenuProps) {
  const labels = { ...defaultUserMenuLabels, ...overrides };
  const [open, setOpen] = React.useState(false);
  const [languageOpen, setLanguageOpen] = React.useState(false);

  /** Run an item and close, so the popover never lingers over the page it opened. */
  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const currentLanguage = language?.options.find((option) => option.value === language.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={labels.trigger}
          className={cn("rounded-full", className)}
        >
          <Avatar className="size-8">
            {user.imageSrc ? <AvatarImage src={user.imageSrc} alt="" /> : null}
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" data-slot="user-menu" className="flex w-80 flex-col gap-2 p-2">
        <div data-slot="user-menu-identity" className="flex items-center gap-3 p-2">
          <Avatar className="size-10">
            {user.imageSrc ? <AvatarImage src={user.imageSrc} alt="" /> : null}
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          {user.plan ? (
            <Badge variant="default" appearance="soft" shape="pill">
              {user.plan}
            </Badge>
          ) : null}
        </div>

        {usage ? (
          <div data-slot="user-menu-usage" className="rounded-md border border-border bg-muted/40 p-3">
            <QuotaWidget {...usage} compact />
          </div>
        ) : null}

        <Separator />

        <div role="group" aria-label={labels.accountGroup} className="flex flex-col">
          {items.map((item) => (
            <button key={item.key} type="button" className={rowClass} onClick={pick(item.onSelect)}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col">
          {language && currentLanguage ? (
            <>
              <button
                type="button"
                aria-expanded={languageOpen}
                className={rowClass}
                onClick={() => setLanguageOpen((value) => !value)}
              >
                {currentLanguage.flag}
                <span>{labels.language}</span>
                <span className="ms-auto text-muted-foreground">{currentLanguage.label}</span>
                <ChevronDownIcon
                  className={cn("transition-transform", languageOpen && "rotate-180")}
                />
              </button>
              {languageOpen ? (
                <div role="group" aria-label={labels.language} className="ms-6 flex flex-col">
                  {language.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={option.value === language.value}
                      className={cn(rowClass, option.value === language.value && "font-medium")}
                      onClick={() => {
                        language.onChange(option.value);
                        setLanguageOpen(false);
                      }}
                    >
                      {option.flag}
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          {theme ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
              <span>{labels.appearance}</span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={theme.value}
                aria-label={labels.appearance}
                // A single-type group reports "" when the active item is clicked
                // again; a theme preference cannot be empty, so that is ignored.
                onValueChange={(value) => value && theme.onChange(value as UserMenuTheme)}
              >
                <ToggleGroupItem value="light" aria-label={labels.light}>
                  <SunIcon />
                  {labels.light}
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label={labels.dark}>
                  <MoonIcon />
                  {labels.dark}
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label={labels.system}>
                  <MonitorIcon />
                  {labels.system}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          ) : null}

          {onHelp ? (
            <button type="button" className={rowClass} onClick={pick(onHelp)}>
              <CircleQuestionMarkIcon aria-hidden />
              {labels.help}
            </button>
          ) : null}
        </div>

        <Separator />

        <button
          type="button"
          className={cn(
            rowClass,
            "text-destructive hover:bg-destructive/10 hover:text-destructive [&_svg]:text-destructive",
          )}
          onClick={pick(onSignOut)}
        >
          <LogOutIcon />
          {labels.signOut}
        </button>
      </PopoverContent>
    </Popover>
  );
}
