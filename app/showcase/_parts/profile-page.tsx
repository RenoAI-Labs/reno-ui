"use client";

import * as React from "react";
import { KeyRoundIcon, LogOutIcon, RefreshCwIcon, ShieldCheckIcon, TrashIcon } from "lucide-react";

import { useTheme } from "@/app/theme-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FileUpload } from "@/components/ui/file-upload";
import { ImageCropper } from "@/components/ui/image-cropper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CURRENT_USER,
  DEFAULT_GRANTS,
  NOTIFICATION_PREFERENCES,
  PERMISSION_GROUPS,
  ROLE_IDS,
  ROLE_LABELS,
  SESSIONS,
  type RoleId,
} from "./mock-admin-data";

/**
 * The profile page of the admin layout standard (§9).
 *
 * Nothing here talks to a server: the avatar is an object URL, the form keeps
 * its saved baseline in state and the session list is a local copy. That is on
 * purpose, a showcase has to run from a static export, and the interesting part
 * is the states (invalid phone, last role, no sessions left), not the wiring.
 */

const TOTAL_PERMISSIONS = PERMISSION_GROUPS.reduce((sum, group) => sum + group.rows.length, 0);

/** Fixed placeholders: the codes are display data, a real project generates them server-side. */
const BACKUP_CODES = ["4F7K-92QD", "A8M3-TX61", "N2VC-70LB", "Q9ZR-15HE", "J6WP-48YS", "B3TD-U07K", "E5GX-83NA", "R1HF-26CM"];

const PHONE_PATTERN = /^(0|\+84)\d{9}$/;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** A fixed date: `new Date()` would differ between the server render and hydration. */
const INITIAL_BIRTHDAY = new Date(1990, 4, 12);

const NOTIFICATION_DEFAULTS: Record<string, boolean> = { leave: true, sync: true, digest: false, product: false };

const STRENGTH_LABELS = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh"];

type SessionsStatus = "ready" | "loading" | "error";

function Section({
  id,
  title,
  description,
  action,
  children,
  footer,
}: {
  id: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-[var(--density-gap)]">{children}</CardContent>
      {footer ? <CardFooter className="flex-wrap justify-end gap-2">{footer}</CardFooter> : null}
    </Card>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-message`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-message`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function AvatarSection() {
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>();
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  // Every object URL made on this page, so unmounting releases them together.
  const urls = React.useRef<string[]>([]);

  React.useEffect(() => {
    const created = urls.current;
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const track = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    return url;
  };

  return (
    <Section
      id="anh-dai-dien"
      title="Ảnh đại diện"
      description="Chọn ảnh, kéo vùng cắt vuông rồi áp dụng. Ảnh chỉ nằm trong trình duyệt, chưa tải lên máy chủ."
    >
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-20">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="Ảnh đại diện hiện tại" /> : null}
          <AvatarFallback className="text-xl">{CURRENT_USER.initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="font-medium">{CURRENT_USER.name}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setCropSrc("/media/sample-photo.png")}>
              Dùng ảnh mẫu
            </Button>
            {avatarUrl ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAvatarUrl(undefined);
                  setMessage("Đã xoá ảnh đại diện, hiển thị chữ cái đầu.");
                }}
              >
                <TrashIcon aria-hidden="true" />
                Xoá ảnh
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {cropSrc ? (
        <div className="flex flex-col gap-2">
          <ImageCropper
            src={cropSrc}
            aspect={1}
            maxWidth={256}
            className="max-w-lg"
            onError={() => setError("Không đọc được ảnh này, hãy thử tệp khác.")}
            onCropped={(file) => {
              setAvatarUrl(track(file));
              setCropSrc(null);
              setError("");
              setMessage(`Đã cập nhật ảnh đại diện (${Math.round(file.size / 1024)} KB).`);
            }}
          />
          <div>
            <Button variant="ghost" size="sm" onClick={() => setCropSrc(null)}>
              Huỷ cắt ảnh
            </Button>
          </div>
        </div>
      ) : (
        <FileUpload
          accept="image/*"
          maxSize={MAX_AVATAR_BYTES}
          onFilesAccepted={([file]) => {
            setCropSrc(track(file));
            setError("");
            setMessage("");
          }}
          onFilesRejected={([rejection]) =>
            setError(rejection.reason === "type" ? "Chỉ nhận tệp ảnh." : "Ảnh vượt quá 2 MB, hãy chọn ảnh nhỏ hơn.")
          }
        />
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </Section>
  );
}

function PersonalInfoSection() {
  const [saved, setSaved] = React.useState({
    name: CURRENT_USER.name,
    phone: CURRENT_USER.phone,
    title: CURRENT_USER.title,
    birthday: INITIAL_BIRTHDAY as Date | undefined,
  });
  const [draft, setDraft] = React.useState(saved);
  const [justSaved, setJustSaved] = React.useState(false);

  const phoneInvalid = !PHONE_PATTERN.test(draft.phone.replace(/\s/g, ""));
  const nameInvalid = draft.name.trim().length < 2;
  const dirty =
    draft.name !== saved.name ||
    draft.phone !== saved.phone ||
    draft.title !== saved.title ||
    draft.birthday?.getTime() !== saved.birthday?.getTime();

  const edit = (patch: Partial<typeof draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setJustSaved(false);
  };

  return (
    <Section
      id="thong-tin-ca-nhan"
      title="Thông tin cá nhân"
      description="Email do quản trị viên cấp nên chỉ đọc."
      footer={
        <>
          {justSaved ? (
            <p role="status" className="mr-auto text-sm text-muted-foreground">
              Đã lưu thông tin cá nhân.
            </p>
          ) : null}
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              setDraft(saved);
              setJustSaved(false);
            }}
          >
            Hoàn tác
          </Button>
          <Button
            disabled={!dirty || phoneInvalid || nameInvalid}
            onClick={() => {
              setSaved(draft);
              setJustSaved(true);
            }}
          >
            Lưu
          </Button>
        </>
      }
    >
      <div className="grid gap-[var(--density-gap)] sm:grid-cols-2">
        <Field id="profile-name" label="Họ và tên" error={nameInvalid ? "Họ và tên phải có ít nhất 2 ký tự." : undefined}>
          <Input
            id="profile-name"
            value={draft.name}
            aria-invalid={nameInvalid}
            aria-describedby="profile-name-message"
            onChange={(event) => edit({ name: event.target.value })}
          />
        </Field>
        <Field id="profile-email" label="Email">
          <Input id="profile-email" type="email" value={CURRENT_USER.email} readOnly />
        </Field>
        <Field
          id="profile-phone"
          label="Số điện thoại"
          error={phoneInvalid ? "Số điện thoại gồm 10 chữ số bắt đầu bằng 0, hoặc +84 và 9 chữ số." : undefined}
        >
          <Input
            id="profile-phone"
            type="tel"
            inputMode="tel"
            value={draft.phone}
            aria-invalid={phoneInvalid}
            aria-describedby="profile-phone-message"
            onChange={(event) => edit({ phone: event.target.value })}
          />
        </Field>
        <Field id="profile-title" label="Chức danh">
          <Input id="profile-title" value={draft.title} onChange={(event) => edit({ title: event.target.value })} />
        </Field>
        <Field id="profile-birthday" label="Ngày sinh">
          <DatePicker
            value={draft.birthday}
            onValueChange={(birthday) => edit({ birthday })}
            placeholder="Chọn ngày sinh"
          />
        </Field>
      </div>
    </Section>
  );
}

function RolesSection() {
  const [roles, setRoles] = React.useState<RoleId[]>(CURRENT_USER.roles);
  const effective = new Set(roles.flatMap((role) => DEFAULT_GRANTS[role] ?? [])).size;

  return (
    <Section
      id="vai-tro"
      title="Vai trò"
      description="Một tài khoản giữ một hoặc nhiều vai trò."
      action={
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <ShieldCheckIcon aria-hidden="true" />
              Gán vai trò
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Phải giữ ít nhất một vai trò.</p>
            {ROLE_IDS.map((role) => {
              const checked = roles.includes(role);
              return (
                <div key={role} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${role}`}
                    checked={checked}
                    // The last remaining role cannot be unticked.
                    disabled={checked && roles.length === 1}
                    onCheckedChange={(next) =>
                      setRoles((prev) =>
                        next === true
                          ? ROLE_IDS.filter((id) => id === role || prev.includes(id))
                          : prev.filter((id) => id !== role),
                      )
                    }
                  />
                  <Label htmlFor={`role-${role}`}>{ROLE_LABELS[role]}</Label>
                </div>
              );
            })}
          </PopoverContent>
        </Popover>
      }
    >
      <ul className="flex flex-wrap gap-2" aria-label="Vai trò của tài khoản">
        {roles.map((role) => (
          <li key={role}>
            <Badge appearance="soft" shape="pill">
              {ROLE_LABELS[role]}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Quyền hiệu lực là hợp các quyền của các vai trò. Hiện có{" "}
        <span className="font-medium text-foreground tabular-nums">
          {effective}/{TOTAL_PERMISSIONS}
        </span>{" "}
        quyền.
      </p>
    </Section>
  );
}

function PasswordSection() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [done, setDone] = React.useState(false);

  const score = next
    ? [next.length >= 8, /[a-z]/.test(next) && /[A-Z]/.test(next), /\d/.test(next), /[^A-Za-z0-9]/.test(next)].filter(Boolean)
        .length
    : 0;
  const mismatch = confirm !== "" && confirm !== next;
  const canSubmit = current !== "" && next.length >= 8 && score >= 2 && confirm === next;

  return (
    <Section
      id="doi-mat-khau"
      title="Đổi mật khẩu"
      description="Dùng ít nhất 8 ký tự, trộn chữ hoa, chữ thường, số và ký hiệu."
      footer={
        <>
          {done ? (
            <p role="status" className="mr-auto text-sm text-muted-foreground">
              Đã đổi mật khẩu.
            </p>
          ) : null}
          <Button
            disabled={!canSubmit}
            onClick={() => {
              setCurrent("");
              setNext("");
              setConfirm("");
              setDone(true);
            }}
          >
            <KeyRoundIcon aria-hidden="true" />
            Đổi mật khẩu
          </Button>
        </>
      }
    >
      <div className="grid gap-[var(--density-gap)] sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="password-current" label="Mật khẩu hiện tại">
            <Input
              id="password-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => {
                setCurrent(event.target.value);
                setDone(false);
              }}
            />
          </Field>
        </div>
        <Field id="password-new" label="Mật khẩu mới">
          <Input
            id="password-new"
            type="password"
            autoComplete="new-password"
            value={next}
            aria-describedby="password-strength"
            onChange={(event) => {
              setNext(event.target.value);
              setDone(false);
            }}
          />
        </Field>
        <Field id="password-confirm" label="Nhập lại mật khẩu mới" error={mismatch ? "Mật khẩu nhập lại không khớp." : undefined}>
          <Input
            id="password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            aria-invalid={mismatch}
            aria-describedby="password-confirm-message"
            onChange={(event) => {
              setConfirm(event.target.value);
              setDone(false);
            }}
          />
        </Field>
      </div>
      <div className="flex flex-col gap-1">
        <Progress value={score * 25} aria-label="Độ mạnh mật khẩu" />
        <p id="password-strength" className="text-sm text-muted-foreground">
          {next ? `Độ mạnh: ${STRENGTH_LABELS[score]}` : "Nhập mật khẩu mới để xem độ mạnh."}
        </p>
      </div>
    </Section>
  );
}

function TwoFactorSection() {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <Section
      id="xac-thuc-hai-lop"
      title="Xác thực hai lớp"
      description="Thêm mã từ ứng dụng xác thực mỗi khi đăng nhập trên thiết bị lạ."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Switch id="two-factor" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="two-factor">{enabled ? "Đang bật" : "Đang tắt"}</Label>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={!enabled}>
              <KeyRoundIcon aria-hidden="true" />
              Mã dự phòng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mã dự phòng</DialogTitle>
              <DialogDescription>Mỗi mã dùng được một lần khi không có ứng dụng xác thực. Hãy cất ở nơi an toàn.</DialogDescription>
            </DialogHeader>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
              {BACKUP_CODES.map((code) => (
                <li key={code} className="rounded-md border px-3 py-2">
                  {code}
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-sm text-muted-foreground">
        {enabled ? "Tài khoản được bảo vệ bằng mã xác thực." : "Tài khoản chỉ được bảo vệ bằng mật khẩu."}
      </p>
    </Section>
  );
}

function SessionsSection() {
  const [sessions, setSessions] = React.useState(SESSIONS);
  const [status, setStatus] = React.useState<SessionsStatus>("ready");
  // The row id to sign out, "others" for every non-current device, null when closed.
  const [pending, setPending] = React.useState<string | null>(null);
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const reload = () => {
    window.clearTimeout(timer.current);
    setStatus("loading");
    timer.current = window.setTimeout(() => setStatus("ready"), 800);
  };

  const hasOthers = sessions.some((session) => !session.current);
  const target = sessions.find((session) => session.id === pending);

  return (
    <Section
      id="lich-su-dang-nhap"
      title="Phiên đăng nhập và lịch sử đăng nhập"
      description="Các thiết bị đang đăng nhập và những lần đăng nhập gần đây."
      action={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" disabled={status === "loading"} onClick={reload}>
            <RefreshCwIcon aria-hidden="true" />
            Tải lại
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setStatus("error")}>
            Giả lập lỗi
          </Button>
        </div>
      }
      footer={
        <Button variant="destructive" disabled={!hasOthers || status !== "ready"} onClick={() => setPending("others")}>
          <LogOutIcon aria-hidden="true" />
          Đăng xuất tất cả thiết bị khác
        </Button>
      }
    >
      {status === "error" ? (
        <ErrorState
          title="Không tải được danh sách phiên"
          body="Kết nối tới máy chủ bị gián đoạn. Hãy thử lại sau ít giây."
          onRetry={reload}
        />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="Không còn phiên đăng nhập nào"
          body="Mọi thiết bị đã được đăng xuất."
          action={
            <Button variant="outline" size="sm" onClick={() => setSessions(SESSIONS)}>
              Khôi phục danh sách mẫu
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thiết bị</TableHead>
              <TableHead>Vị trí</TableHead>
              <TableHead>Hoạt động gần nhất</TableHead>
              <TableHead>Kết quả</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status === "loading"
              ? ["a", "b", "c"].map((key) => (
                  <TableRow key={key}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {session.device}
                        {session.current ? (
                          <Badge variant="secondary" shape="pill">
                            Thiết bị này
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{session.location}</TableCell>
                    <TableCell>{session.lastActive}</TableCell>
                    <TableCell>
                      <Badge appearance="soft" variant={session.result === "ok" ? "success" : "destructive"}>
                        {session.result === "ok" ? "Thành công" : "Thất bại"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {session.current ? null : (
                        <Button variant="ghost" size="sm" onClick={() => setPending(session.id)}>
                          Đăng xuất
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => (open ? undefined : setPending(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending === "others" ? "Đăng xuất mọi thiết bị khác?" : `Đăng xuất ${target?.device ?? "thiết bị"}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Thiết bị bị đăng xuất sẽ phải nhập lại mật khẩu ở lần truy cập sau. Thiết bị này không bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() =>
                setSessions((prev) =>
                  prev.filter((session) => session.current || (pending !== "others" && session.id !== pending)),
                )
              }
            >
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}

function PreferencesSection() {
  const { mode, setMode } = useTheme();
  const [language, setLanguage] = React.useState("vi");
  // "Auto" is not a mode the provider knows: it resolves to the system scheme
  // once, and the toggle remembers that the user asked for it.
  const [auto, setAuto] = React.useState(false);
  const [notifications, setNotifications] = React.useState(NOTIFICATION_DEFAULTS);

  return (
    <Section
      id="tuy-chon"
      title="Tuỳ chọn"
      description="Ngôn ngữ, giao diện và thông báo cho riêng tài khoản này."
    >
      <div className="grid gap-[var(--density-gap)] sm:grid-cols-2">
        <Field id="pref-language" label="Ngôn ngữ">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="pref-language" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex flex-col gap-2">
          <Label id="pref-theme-label">Giao diện</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            aria-labelledby="pref-theme-label"
            value={auto ? "auto" : mode}
            onValueChange={(value) => {
              if (!value) return;
              setAuto(value === "auto");
              setMode(
                value === "auto"
                  ? window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
                  : (value as "light" | "dark"),
              );
            }}
          >
            <ToggleGroupItem value="light">Sáng</ToggleGroupItem>
            <ToggleGroupItem value="dark">Tối</ToggleGroupItem>
            <ToggleGroupItem value="auto">Auto</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex flex-col divide-y rounded-md border">
        {NOTIFICATION_PREFERENCES.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 p-3">
            <div className="min-w-0">
              <Label htmlFor={`notify-${item.id}`}>{item.label}</Label>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              id={`notify-${item.id}`}
              checked={notifications[item.id] ?? false}
              onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.id]: checked }))}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

export function ProfilePage() {
  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" subtitle={`${CURRENT_USER.title} - ${CURRENT_USER.email}`} />
      <div className="flex max-w-4xl flex-col gap-[var(--density-gap)] pb-8">
        <AvatarSection />
        <PersonalInfoSection />
        <RolesSection />
        <PasswordSection />
        <TwoFactorSection />
        <SessionsSection />
        <PreferencesSection />
      </div>
    </>
  );
}
