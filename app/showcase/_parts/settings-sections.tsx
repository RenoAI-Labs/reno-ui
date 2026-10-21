"use client";

import * as React from "react";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CircleAlertIcon,
  MailIcon,
  PlugIcon,
  WalletIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuotaWidget } from "@/components/ui/quota-widget";
import { SaveBar } from "@/components/ui/save-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { CURRENT_USER } from "./mock-admin-data";
import { ShowcaseBrandPanel } from "./showcase-brand-panel";

// ---------------------------------------------------------------------------
// Draft state shared by the three form tabs
// ---------------------------------------------------------------------------

type FieldValue = string | number | boolean;

/** What a form section reads and writes: the draft values, the dirty count and the three actions. */
export interface Draft<T extends Record<string, FieldValue>> {
  draft: T;
  dirtyCount: number;
  justSaved: boolean;
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  revert: () => void;
  save: () => void;
}

/**
 * A flat form with a saved snapshot. The dirty count is the number of fields
 * that differ from the snapshot, which is what the SaveBar shows. The hook lives
 * in the page, not in each section, so a half-edited tab survives switching to
 * another tab and back.
 */
export function useDraft<T extends Record<string, FieldValue>>(initial: T): Draft<T> {
  const [saved, setSaved] = React.useState(initial);
  const [draft, setDraft] = React.useState(initial);
  const [justSaved, setJustSaved] = React.useState(false);

  const dirtyCount = (Object.keys(draft) as (keyof T)[]).filter(
    (key) => draft[key] !== saved[key],
  ).length;

  React.useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [justSaved]);

  return {
    draft,
    dirtyCount,
    justSaved,
    set: (key, value) => {
      setJustSaved(false);
      setDraft((current) => ({ ...current, [key]: value }));
    },
    revert: () => setDraft(saved),
    save: () => {
      setSaved(draft);
      setJustSaved(true);
    },
  };
}

export const GENERAL_DEFAULTS = {
  name: "Công ty TNHH Hoa Sen",
  timezone: "Asia/Ho_Chi_Minh",
  language: "vi",
  address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  description: "Không gian làm việc của khối nhân sự và vận hành.",
};

export const NOTIFICATION_DEFAULTS = {
  email: true,
  push: true,
  zalo: false,
  frequency: "daily",
};

export const SECURITY_DEFAULTS = {
  minLength: 10,
  require2fa: true,
  sessionTimeout: "60",
  ipAllowList: "113.161.0.0/16\n14.241.10.25",
};

/** The form footer: the "Đã lưu" confirmation above the shared sticky bar. */
function FormFooter<T extends Record<string, FieldValue>>({ form }: { form: Draft<T> }) {
  return (
    <div className="flex flex-col gap-2">
      <p
        role="status"
        className={cn(
          "flex items-center gap-1 text-sm text-success-soft-foreground",
          !form.justSaved && "sr-only",
        )}
      >
        {form.justSaved ? (
          <>
            <CheckIcon className="size-4" aria-hidden />
            Đã lưu
          </>
        ) : null}
      </p>
      <SaveBar dirtyCount={form.dirtyCount} onRevert={form.revert} onSave={form.save} />
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chung
// ---------------------------------------------------------------------------

const TIMEZONES = [
  { value: "Asia/Ho_Chi_Minh", label: "(GMT+7) Hồ Chí Minh" },
  { value: "Asia/Bangkok", label: "(GMT+7) Bangkok" },
  { value: "Asia/Singapore", label: "(GMT+8) Singapore" },
  { value: "Asia/Tokyo", label: "(GMT+9) Tokyo" },
];

const LANGUAGES = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

export function GeneralSection({ form }: { form: Draft<typeof GENERAL_DEFAULTS> }) {
  const { draft, set } = form;
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin chung</CardTitle>
          <CardDescription>Tên, múi giờ và ngôn ngữ hiển thị của không gian làm việc.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-[var(--density-gap)] md:grid-cols-2">
          <div className="md:col-span-2">
            <Field id="ws-name" label="Tên không gian">
              <Input id="ws-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
          </div>
          <Field id="ws-timezone" label="Múi giờ">
            <Select value={draft.timezone} onValueChange={(v) => set("timezone", v)}>
              <SelectTrigger id="ws-timezone" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="ws-language" label="Ngôn ngữ">
            <Select value={draft.language} onValueChange={(v) => set("language", v)}>
              <SelectTrigger id="ws-language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field id="ws-address" label="Địa chỉ">
              <Input
                id="ws-address"
                value={draft.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field id="ws-description" label="Mô tả">
              <Textarea
                id="ws-description"
                rows={4}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>
      <FormFooter form={form} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Thương hiệu
// ---------------------------------------------------------------------------

export function BrandSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thương hiệu</CardTitle>
        <CardDescription>
          Màu sắc và phong cách được cấu hình riêng cho từng dự án, còn bố cục giao diện quản trị
          là cố định và không thay đổi giữa các dự án.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ShowcaseBrandPanel />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Thông báo
// ---------------------------------------------------------------------------

const FREQUENCIES = [
  { value: "instant", label: "Ngay lập tức" },
  { value: "daily", label: "Tổng hợp hằng ngày" },
  { value: "weekly", label: "Tổng hợp hằng tuần" },
];

export function NotificationsSection({ form }: { form: Draft<typeof NOTIFICATION_DEFAULTS> }) {
  const { draft, set } = form;
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Kênh nhận thông báo</CardTitle>
          <CardDescription>Chọn nơi hệ thống gửi thông báo cho cả không gian làm việc.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          <SwitchRow
            id="notify-email"
            label="Email"
            description="Gửi tới hộp thư của từng thành viên."
            checked={draft.email}
            onCheckedChange={(v) => set("email", v)}
          />
          <SwitchRow
            id="notify-push"
            label="Thông báo đẩy"
            description="Hiện trên trình duyệt và ứng dụng di động."
            checked={draft.push}
            onCheckedChange={(v) => set("push", v)}
          />
          <SwitchRow
            id="notify-zalo"
            label="Zalo"
            description="Gửi qua tài khoản Zalo OA của công ty."
            checked={draft.zalo}
            onCheckedChange={(v) => set("zalo", v)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tần suất</CardTitle>
          <CardDescription>Gộp các thông báo cùng loại để hộp thư bớt nhiễu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field id="notify-frequency" label="Tần suất gửi">
            <Select value={draft.frequency} onValueChange={(v) => set("frequency", v)}>
              <SelectTrigger id="notify-frequency" className="w-full md:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>
      <FormFooter form={form} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Bảo mật
// ---------------------------------------------------------------------------

const SESSION_TIMEOUTS = [
  { value: "15", label: "15 phút" },
  { value: "60", label: "1 giờ" },
  { value: "480", label: "8 giờ" },
  { value: "1440", label: "24 giờ" },
];

export function SecuritySection({ form }: { form: Draft<typeof SECURITY_DEFAULTS> }) {
  const { draft, set } = form;
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Mật khẩu và đăng nhập</CardTitle>
          <CardDescription>Áp dụng cho mọi tài khoản trong không gian làm việc.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-[var(--density-gap)]">
          <Field
            id="sec-min-length"
            label="Độ dài mật khẩu tối thiểu"
            hint="Từ 8 đến 64 ký tự."
          >
            <Input
              id="sec-min-length"
              type="number"
              min={8}
              max={64}
              className="md:w-40"
              value={draft.minLength}
              onChange={(e) => set("minLength", Number(e.target.value))}
            />
          </Field>
          <div className="divide-y divide-border">
            <SwitchRow
              id="sec-2fa"
              label="Bắt buộc xác thực hai bước"
              description="Mọi thành viên phải bật 2FA ở lần đăng nhập kế tiếp."
              checked={draft.require2fa}
              onCheckedChange={(v) => set("require2fa", v)}
            />
          </div>
          <Field id="sec-timeout" label="Thời gian hết phiên">
            <Select value={draft.sessionTimeout} onValueChange={(v) => set("sessionTimeout", v)}>
              <SelectTrigger id="sec-timeout" className="w-full md:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TIMEOUTS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách IP được phép</CardTitle>
          <CardDescription>Để trống nếu cho phép đăng nhập từ mọi địa chỉ.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field id="sec-ip" label="Địa chỉ IP hoặc dải CIDR" hint="Mỗi dòng một địa chỉ.">
            <Textarea
              id="sec-ip"
              rows={4}
              className="font-mono"
              value={draft.ipAllowList}
              onChange={(e) => set("ipAllowList", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>
      <FormFooter form={form} />
    </>
  );
}

// ---------------------------------------------------------------------------
// View-state switcher: a showcase shows the states that break
// ---------------------------------------------------------------------------

type ViewState = "ready" | "loading" | "empty" | "error";

const VIEW_STATES: { value: ViewState; label: string }[] = [
  { value: "ready", label: "Có dữ liệu" },
  { value: "loading", label: "Đang tải" },
  { value: "empty", label: "Trống" },
  { value: "error", label: "Lỗi" },
];

function ViewStateSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ViewState;
  onChange: (next: ViewState) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-muted-foreground">
        Trạng thái hiển thị
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as ViewState)}>
        <SelectTrigger id={id} size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VIEW_STATES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tích hợp
// ---------------------------------------------------------------------------

type IntegrationStatus = "connected" | "error" | "disconnected";

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: IntegrationStatus;
};

const INITIAL_INTEGRATIONS: Integration[] = [
  { id: "timekeeping", name: "Chấm công", description: "Đồng bộ ca làm và giờ vào ra từ máy chấm công.", icon: ClockIcon, status: "connected" },
  { id: "payroll", name: "Lương", description: "Đẩy bảng lương đã duyệt sang phần mềm kế toán.", icon: WalletIcon, status: "error" },
  { id: "email", name: "Email", description: "Gửi thư mời và thông báo qua máy chủ SMTP của công ty.", icon: MailIcon, status: "connected" },
  { id: "calendar", name: "Lịch", description: "Hiển thị lịch phỏng vấn và nghỉ phép trên lịch chung.", icon: CalendarIcon, status: "disconnected" },
];

const STATUS_BADGE: Record<
  IntegrationStatus,
  { label: string; variant: "success" | "warning" | "secondary" }
> = {
  connected: { label: "Đã kết nối", variant: "success" },
  error: { label: "Cần kết nối lại", variant: "warning" },
  disconnected: { label: "Chưa kết nối", variant: "secondary" },
};

export function IntegrationsSection() {
  const [integrations, setIntegrations] = React.useState(INITIAL_INTEGRATIONS);
  const [view, setView] = React.useState<ViewState>("ready");

  const toggle = (id: string) =>
    setIntegrations((list) =>
      list.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "connected" ? "disconnected" : "connected" }
          : item,
      ),
    );

  const broken = integrations.filter((item) => item.status === "error");

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <div className="flex justify-end">
        <ViewStateSelect id="integrations-view" value={view} onChange={setView} />
      </div>

      {view === "ready" && broken.length > 0 ? (
        <Alert variant="destructive" appearance="soft">
          <CircleAlertIcon />
          <AlertTitle>Tích hợp {broken.map((item) => item.name).join(", ")} đã mất kết nối</AlertTitle>
          <AlertDescription>
            Mã truy cập đã hết hạn nên dữ liệu không còn đồng bộ. Hãy kết nối lại để tiếp tục.
          </AlertDescription>
        </Alert>
      ) : null}

      {view === "loading" ? (
        <div className="grid gap-[var(--density-gap)] md:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {view === "empty" ? (
        <Card>
          <EmptyState
            icon={<PlugIcon className="size-8 text-muted-foreground" aria-hidden />}
            title="Chưa có tích hợp nào"
            body="Kết nối chấm công, lương, email hoặc lịch để dữ liệu tự động đồng bộ."
          />
        </Card>
      ) : null}

      {view === "error" ? (
        <Card>
          <ErrorState
            title="Không tải được danh sách tích hợp"
            body="Máy chủ không phản hồi. Kiểm tra kết nối rồi thử lại."
            onRetry={() => setView("ready")}
          />
        </Card>
      ) : null}

      {view === "ready" ? (
        <div className="grid gap-[var(--density-gap)] md:grid-cols-2">
          {integrations.map((item) => {
            const badge = STATUS_BADGE[item.status];
            const Icon = item.icon;
            return (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                    {item.name}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <Badge variant={badge.variant} appearance="soft">
                    {badge.label}
                  </Badge>
                  <Button
                    variant={item.status === "connected" ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggle(item.id)}
                    aria-label={`${item.status === "connected" ? "Ngắt kết nối" : item.status === "error" ? "Kết nối lại" : "Kết nối"} ${item.name}`}
                  >
                    {item.status === "connected"
                      ? "Ngắt"
                      : item.status === "error"
                        ? "Kết nối lại"
                        : "Kết nối"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gói và thanh toán
// ---------------------------------------------------------------------------

const PLANS = [
  { name: "Cơ Bản", price: "0 đ", seats: "Tối đa 25 thành viên", features: ["Hồ sơ nhân sự", "Nghỉ phép", "Báo cáo cơ bản"] },
  { name: "Cao Cấp", price: "1.900.000 đ / tháng", seats: "Tối đa 200 thành viên", features: ["Tất cả của gói Cơ Bản", "Tuyển dụng và đào tạo", "Tích hợp chấm công, lương"] },
  { name: "Doanh Nghiệp", price: "Liên hệ", seats: "Không giới hạn thành viên", features: ["Tất cả của gói Cao Cấp", "Phân quyền nâng cao", "Hỗ trợ riêng 24/7"] },
];

const INVOICES = [
  { id: "HD-2026-010", date: "01/10/2026", amount: "1.900.000 đ", status: "Chưa thanh toán" },
  { id: "HD-2026-009", date: "01/09/2026", amount: "1.900.000 đ", status: "Đã thanh toán" },
  { id: "HD-2026-008", date: "01/08/2026", amount: "1.900.000 đ", status: "Đã thanh toán" },
  { id: "HD-2026-007", date: "01/07/2026", amount: "1.900.000 đ", status: "Đã thanh toán" },
  { id: "HD-2026-006", date: "01/06/2026", amount: "1.900.000 đ", status: "Đã thanh toán" },
];

export function BillingSection() {
  const [view, setView] = React.useState<ViewState>("ready");

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Gói hiện tại
            <Badge variant="default" appearance="soft">
              {CURRENT_USER.plan}
            </Badge>
          </CardTitle>
          <CardDescription>Điểm dùng cho báo cáo, tuyển dụng và lưu trữ tài liệu.</CardDescription>
        </CardHeader>
        <CardContent>
          <QuotaWidget
            compact
            label="Điểm còn lại"
            remaining={2155}
            total={4300}
            caption="Gia hạn 12/11/2026"
          />
        </CardContent>
      </Card>

      <section aria-labelledby="plans-heading" className="flex flex-col gap-2">
        <h2 id="plans-heading" className="text-base font-semibold">
          So sánh các gói
        </h2>
        <div className="grid gap-[var(--density-gap)] md:grid-cols-3">
          {PLANS.map((plan) => {
            const current = plan.name === CURRENT_USER.plan;
            return (
              <Card
                key={plan.name}
                className={cn(current && "border-primary ring-1 ring-primary")}
                aria-current={current ? "true" : undefined}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    {plan.name}
                    {current ? <Badge>Đang dùng</Badge> : null}
                  </CardTitle>
                  <CardDescription>{plan.price}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="text-sm font-medium">{plan.seats}</p>
                  <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckIcon className="size-4 text-success-soft-foreground" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant={current ? "outline" : "default"} size="sm" disabled={current} className="mt-auto">
                    {current ? "Gói hiện tại" : "Chọn gói này"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử hóa đơn</CardTitle>
          <CardDescription>Năm hóa đơn gần nhất của không gian làm việc.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex justify-end">
            <ViewStateSelect id="invoices-view" value={view} onChange={setView} />
          </div>
          {view === "ready" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã hóa đơn</TableHead>
                  <TableHead>Ngày phát hành</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {INVOICES.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="text-right tabular-nums">{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={invoice.status === "Đã thanh toán" ? "success" : "warning"}
                        appearance="soft"
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
          {view === "loading" ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : null}
          {view === "empty" ? (
            <EmptyState title="Chưa có hóa đơn" body="Hóa đơn đầu tiên sẽ xuất hiện sau kỳ thanh toán." />
          ) : null}
          {view === "error" ? (
            <ErrorState
              title="Không tải được hóa đơn"
              body="Hệ thống thanh toán chưa phản hồi."
              onRetry={() => setView("ready")}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
