import registry from "@/registry.json";

export type RegistryItemType =
  | "registry:ui"
  | "registry:lib"
  | "registry:hook"
  | "registry:block"
  | "registry:theme";

export type RegistryItemMeta = {
  /** `shadcn/ui` or `original`. Enforced by scripts/check-provenance.mjs. */
  source: string;
  license: string;
  upstream?: string;
  added: string;
  /** Display grouping on the docs index: Form, Overlay, Layout, ... */
  group?: string;
};

export type RegistryItem = {
  name: string;
  type: RegistryItemType;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: { path: string; type: string }[];
  meta?: RegistryItemMeta;
};

/**
 * `registry.json` is the single source of truth for what this registry ships.
 * The docs site reads it directly rather than keeping a parallel list — a
 * component that is not installable cannot get a docs page by accident, and a
 * new item shows up in the docs the moment it is registered.
 */
export const REGISTRY_NAME: string = registry.name;
export const REGISTRY_HOMEPAGE: string = registry.homepage;
export const ITEMS = registry.items as RegistryItem[];

export const UI_ITEMS = ITEMS.filter((i) => i.type === "registry:ui");
export const BLOCK_ITEMS = ITEMS.filter((i) => i.type === "registry:block");
export const THEME_ITEMS = ITEMS.filter((i) => i.type === "registry:theme");

export function getItem(name: string): RegistryItem | undefined {
  return ITEMS.find((i) => i.name === name);
}

/** Order groups are presented in — roughly how often a project reaches for them. */
const GROUP_ORDER = ["Form", "Overlay", "Layout", "Data", "Feedback", "Nav", "Core"];

/**
 * Group the primitives for the docs index. Forty flat cards is a wall; grouped
 * by role it is browsable.
 */
export function groupedUiItems(): { group: string; items: RegistryItem[] }[] {
  const groups = new Map<string, RegistryItem[]>();
  for (const item of UI_ITEMS) {
    const key = item.meta?.group ?? "Other";
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()]
    .map(([group, items]) => ({
      group,
      items: items.sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => {
      const ia = GROUP_ORDER.indexOf(a.group);
      const ib = GROUP_ORDER.indexOf(b.group);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

/** The exact command a consumer runs to install an item. */
export function installCommand(name: string): string {
  return `npx shadcn@latest add @reno/${name}`;
}
