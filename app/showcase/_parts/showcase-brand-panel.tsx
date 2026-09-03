"use client";

import * as React from "react";
import { wcagContrast } from "culori";
import { CheckIcon, CopyIcon, PaletteIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BASE_PRESET } from "@/registry/reno/themes/theme-presets.config.mjs";
import { useTheme } from "@/app/theme-provider";

import {
  BRAND_VAR_NAMES,
  DENSITY_STEPS,
  DENSITY_VAR_NAMES,
  RADIUS_CHOICES,
  RADIUS_VAR_NAMES,
  SECONDARY_VAR_NAMES,
  brandHex,
  brandOverrides,
  densityOverrides,
  presetDensityStep,
  radiusOverride,
  secondaryOverrides,
  toCssBlock,
  type DensityStep,
  type RadiusChoice,
  type TokenOverride,
} from "./showcase-brand-tokens";

/**
 * Configure a brand.
 *
 * reno ships one theme. This is how a project makes it theirs: a brand colour,
 * a secondary, a corner radius and a spacing step — the four things the theme is
 * built from — applied live, measured for contrast, and copyable as the CSS to
 * paste into their own `globals.css`.
 *
 * It replaced a row of four buttons named after our own domains. Those asked a
 * visitor to pick one of ours; this asks what their brand is. The knobs are the
 * same ones the presets encoded, so nothing was lost but the four names.
 *
 * Every value derives from `theme-presets.config.mjs` — the ramp from the same
 * `buildRamp` the build script uses, the spacing from the same `DENSITY` steps.
 * Nothing here can preview a value `npm run theme:generate` could not produce,
 * with one stated exception: the secondary pair, which the build solves for
 * contrast and this can only approximate. That is why both ratios are measured
 * and shown rather than asserted.
 */

/** Contrast floors. Same numbers as `CONTRAST` in the theme config. */
const AA_TEXT = 4.5;

const DENSITY_LABELS: Record<DensityStep, string> = {
  compact: "Gọn",
  normal: "Thường",
  comfortable: "Thoáng",
  roomy: "Rộng",
};

/**
 * Named by size, not by shape.
 *
 * An earlier draft called `0rem` "Vuông", which is a promise the token scale
 * cannot keep: `Card` uses `rounded-xl`, which is `calc(var(--radius) + 4px)`,
 * so at zero a card still has 4px corners while a button reaches 0. That offset
 * scale is the shadcn convention and not worth breaking — but the label was
 * telling people to expect square and then not delivering it, which is why they
 * read the control as broken.
 */
const RADIUS_LABELS: Record<RadiusChoice, string> = {
  "0rem": "Nhỏ nhất",
  "0.25rem": "Nhỏ",
  "0.5rem": "Vừa",
  "0.75rem": "Lớn",
  "1rem": "Rất lớn",
};

/** Everything the panel can override, so a reset can clear all of it. */
const ALL_VAR_NAMES = [
  ...BRAND_VAR_NAMES,
  ...SECONDARY_VAR_NAMES,
  ...DENSITY_VAR_NAMES,
  ...RADIUS_VAR_NAMES,
];

type BrandSettings = {
  brand: string | null;
  secondary: string | null;
  density: DensityStep | null;
  radius: RadiusChoice | null;
};

const EMPTY: BrandSettings = { brand: null, secondary: null, density: null, radius: null };

export function ShowcaseBrandPanel() {
  const { mode } = useTheme();

  /*
    Plain state now. It used to be scoped to the preset it was dialled under, so
    that switching preset dropped the overrides by derivation — there is no
    preset to switch, so there is nothing to scope it to.
  */
  const [settings, setSettings] = React.useState<BrandSettings>(EMPTY);

  const update = (patch: Partial<BrandSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  const [copied, setCopied] = React.useState(false);
  const [contrast, setContrast] = React.useState<{ primary: number | null; secondary: number | null }>(
    { primary: null, secondary: null },
  );

  const primaryProbe = React.useRef<HTMLSpanElement>(null);
  const secondaryProbe = React.useRef<HTMLSpanElement>(null);

  /**
   * The overrides this panel is currently applying.
   *
   * Derived entirely from state and the theme config — nothing here reads the
   * page. An earlier draft read the current `--secondary` off `<html>` to
   * re-hue it, which drifts: the panel writes that variable itself, so each
   * change reads back its own previous output.
   */
  const overrides = React.useMemo<TokenOverride[]>(() => {
    const list: TokenOverride[] = [];
    if (settings.brand) list.push(...brandOverrides(settings.brand));
    if (settings.secondary) list.push(...secondaryOverrides(settings.secondary, mode));
    if (settings.density) list.push(...densityOverrides(settings.density));
    if (settings.radius) list.push(...radiusOverride(settings.radius));
    return list;
  }, [settings, mode]);

  /*
    Writing custom properties onto <html> is a DOM side effect, so it lives in
    an effect: applied, replaced and torn down from one place that cannot get
    out of step with state.
  */
  React.useEffect(() => {
    const root = document.documentElement;
    for (const { name, value } of overrides) root.style.setProperty(name, value);
    return () => {
      for (const name of ALL_VAR_NAMES) root.style.removeProperty(name);
    };
  }, [overrides]);

  /**
   * Measure what was painted instead of re-deriving it.
   *
   * `--primary` resolves to a ramp reference in some presets and to a solved
   * literal in others, so recomputing the ratio here would be a second,
   * divergent implementation of `generate-scale.mjs`. Reading a probe's
   * computed style gives whatever the browser actually used.
   */
  React.useEffect(() => {
    const measure = (node: HTMLSpanElement | null) => {
      if (!node) return null;
      const styles = getComputedStyle(node);
      const ratio = wcagContrast(styles.color, styles.backgroundColor);
      return Number.isFinite(ratio) ? ratio : null;
    };
    setContrast({
      primary: measure(primaryProbe.current),
      secondary: measure(secondaryProbe.current),
    });
  }, [overrides]);

  const activeDensity = settings.density ?? presetDensityStep(BASE_PRESET.density) ?? "normal";

  const cssBlock = toCssBlock(overrides);
  const failing =
    (contrast.primary !== null && contrast.primary < AA_TEXT) ||
    (contrast.secondary !== null && contrast.secondary < AA_TEXT);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cssBlock);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused (insecure origin, denied permission).
      // Saying nothing would look like a working button that does nothing.
      setCopied(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <PaletteIcon />
          <span className="hidden sm:inline">Thương hiệu</span>
          {failing ? <TriangleAlertIcon className="text-warning" /> : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-[var(--density-gap)]">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Thương hiệu</p>
            <p className="text-xs text-muted-foreground">
              Đổi màu, bo góc và mật độ ngay trên trình duyệt. Ghi đè custom property trên
              <code className="mx-1 font-mono">&lt;html&gt;</code>; không build lại, không sửa
              dòng component nào.
            </p>
          </div>

          <Field label="Màu chính" htmlFor="brand-primary">
            <ColorInput
              id="brand-primary"
              value={settings.brand ?? brandHex(BASE_PRESET.brand)}
              onChange={(hex) => update({ brand: hex })}
            />
          </Field>

          <Field label="Màu phụ" htmlFor="brand-secondary">
            <ColorInput
              id="brand-secondary"
              value={settings.secondary ?? brandHex(BASE_PRESET.neutral)}
              onChange={(hex) => update({ secondary: hex })}
            />
          </Field>

          <Field label="Bo góc" htmlFor="brand-radius">
            <Select
              value={settings.radius ?? BASE_PRESET.radius}
              onValueChange={(next) => update({ radius: next as RadiusChoice })}
            >
              <SelectTrigger id="brand-radius" size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_CHOICES.map((choice) => (
                  <SelectItem key={choice} value={choice}>
                    {RADIUS_LABELS[choice]} · {choice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Mật độ" htmlFor="brand-density">
            <Select
              value={activeDensity}
              onValueChange={(next) => update({ density: next as DensityStep })}
            >
              <SelectTrigger id="brand-density" size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DENSITY_STEPS.map((step) => (
                  <SelectItem key={step} value={step}>
                    {DENSITY_LABELS[step]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Separator />

          {/*
            The buttons the settings above are about. "Setting cho primary
            button" is not a separate control — a button's fill is `--primary`,
            its height `--density-control-height`, its corners `--radius` — so
            showing them here is what makes that connection visible instead of
            claimed.
          */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Xem trước</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Nút chính</Button>
              <Button size="sm" variant="secondary">
                Nút phụ
              </Button>
              <Button size="sm" variant="outline">
                Viền
              </Button>
            </div>
          </div>

          <ContrastLine label="Chữ chính / nền" ratio={contrast.primary} />
          <ContrastLine label="Nút phụ" ratio={contrast.secondary} />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={cssBlock.length === 0}
              onClick={copy}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Đã copy" : "Copy CSS"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={cssBlock.length === 0}
              onClick={() => setSettings(EMPTY)}
            >
              <RotateCcwIcon />
              Đặt lại
            </Button>
          </div>
        </div>

        {/*
          Probes for the measurements above. Not `hidden`: a display:none element
          still computes colours, but keeping them in flow at zero size avoids
          depending on that detail.
        */}
        <span
          ref={primaryProbe}
          aria-hidden
          className="pointer-events-none absolute size-0 overflow-hidden"
          style={{ color: "var(--primary)", background: "var(--background)" }}
        />
        <span
          ref={secondaryProbe}
          aria-hidden
          className="pointer-events-none absolute size-0 overflow-hidden"
          style={{ color: "var(--secondary-foreground)", background: "var(--secondary)" }}
        />
      </PopoverContent>
    </Popover>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-[var(--density-gap)]">
      <Label htmlFor={htmlFor} className="shrink-0 text-xs">
        {label}
      </Label>
      <div className="w-40">{children}</div>
    </div>
  );
}

function ColorInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <input
      id={id}
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-[var(--density-control-height-sm)] w-full cursor-pointer rounded-md border border-input bg-background p-1"
    />
  );
}

function ContrastLine({ label, ratio }: { label: string; ratio: number | null }) {
  if (ratio === null) return null;
  const fails = ratio < AA_TEXT;
  return (
    <p className={fails ? "text-xs text-warning" : "text-xs text-muted-foreground"}>
      {label}: {ratio.toFixed(2)}:1 — {fails ? "dưới ngưỡng AA 4,5:1" : "đạt AA"}
    </p>
  );
}
