"use client";

import * as React from "react";

import {
  DEFAULT_PAGE_SIZE,
  emptyQuery,
  parseSearchParams,
  toSearchParams,
  type GridQuery,
} from "@/lib/grid-query";

/**
 * Mirrors grid state into the URL so a filtered view survives a reload and can
 * be shared as a link.
 *
 * Deliberately a separate item from the grid itself: a project that does not
 * want URL state should not pay for it, and the grid must not assume a router.
 *
 * Framework-neutral on purpose — it uses the History API directly rather than
 * `next/navigation`, so reno-ui stays usable outside Next.js. A project with a
 * router can skip this hook and wire its own; the query shape is the same.
 *
 * The URL is the state. This hook keeps no copy of it: it subscribes to
 * `window.location.search` through `useSyncExternalStore` and derives the query
 * on read. Mirroring the URL into `useState` would mean rendering a stale value
 * first and correcting it in an effect, which is both a visible flash and a
 * wasted render.
 */

export type UseDataGridUrlStateOptions = {
  /**
   * Prefix for this grid's params. Required when two grids share a page,
   * otherwise they overwrite each other's state.
   */
  key?: string;
  defaultPageSize?: number;
  /**
   * `replace` (default) keeps the back button meaning "previous page of the app".
   * `push` makes each filter change a history entry, which users often read as
   * a trap — choose it deliberately.
   */
  history?: "replace" | "push";
};

const OWN_PARAMS = ["page", "size", "sort", "f", "q"];

/** Namespace a grid's params so several grids can coexist on one page. */
function withPrefix(params: URLSearchParams, prefix: string): URLSearchParams {
  if (!prefix) return params;
  const out = new URLSearchParams();
  for (const [key, value] of params) out.append(`${prefix}_${key}`, value);
  return out;
}

function stripPrefix(search: string, prefix: string): URLSearchParams {
  const source = new URLSearchParams(search);
  if (!prefix) return source;
  const out = new URLSearchParams();
  const head = `${prefix}_`;
  for (const [key, value] of source) {
    if (key.startsWith(head)) out.append(key.slice(head.length), value);
  }
  return out;
}

/** Params belonging to other things on the page, which must survive our writes. */
function foreignParams(search: string, prefix: string): URLSearchParams {
  const source = new URLSearchParams(search);
  const ours = new Set(OWN_PARAMS.map((k) => (prefix ? `${prefix}_${k}` : k)));
  const out = new URLSearchParams();
  for (const [key, value] of source) {
    if (!ours.has(key)) out.append(key, value);
  }
  return out;
}

/*
 * `pushState` / `replaceState` do not fire `popstate`, so our own writes have to
 * notify subscribers explicitly. Module scope, because several grids on one page
 * must all see a URL change made by any of them.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

const getSearchSnapshot = () => window.location.search;
const getServerSearchSnapshot = () => "";

export function useDataGridUrlState({
  key = "",
  defaultPageSize = DEFAULT_PAGE_SIZE,
  history = "replace",
}: UseDataGridUrlStateOptions = {}) {
  const search = React.useSyncExternalStore(
    subscribe,
    getSearchSnapshot,
    getServerSearchSnapshot,
  );

  // On the server there is no URL, so `search` is "" and this yields the
  // defaults — the same thing the client renders before hydration.
  const query = React.useMemo<GridQuery>(
    () => parseSearchParams(stripPrefix(search, key), { pageSize: defaultPageSize }),
    [search, key, defaultPageSize],
  );

  const setQuery = React.useCallback(
    (next: GridQuery | ((current: GridQuery) => GridQuery)) => {
      const current = parseSearchParams(stripPrefix(window.location.search, key), {
        pageSize: defaultPageSize,
      });
      const resolved = typeof next === "function" ? next(current) : next;

      const params = foreignParams(window.location.search, key);
      for (const [k, v] of withPrefix(toSearchParams(resolved), key)) {
        params.append(k, v);
      }
      const qs = params.toString();
      const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;

      window.history[history === "push" ? "pushState" : "replaceState"](null, "", url);
      notify();
    },
    [key, defaultPageSize, history],
  );

  const reset = React.useCallback(
    () => setQuery(emptyQuery(defaultPageSize)),
    [setQuery, defaultPageSize],
  );

  return { query, setQuery, reset };
}
