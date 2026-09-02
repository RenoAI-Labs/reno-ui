"use client";

import * as React from "react";

import {
  AUTO_QUALITY,
  sourceKind,
  type VideoErrorKind,
  type VideoRendition,
  type VideoSource,
} from "@/lib/video-source";

/**
 * The only file in the registry that touches hls.js.
 *
 * Everything above it speaks the vocabulary of `video-source.ts`, so an hls.js
 * major version is a change here and nowhere else — the same containment
 * `use-data-grid.ts` gives TanStack. `scripts/check-boundaries.mjs` fails if any
 * other file imports the package.
 *
 * The import is dynamic, and that is load-bearing rather than tidy. hls.js is
 * about 150 kB minified; a static import would put it in the bundle of every
 * page that renders a player, including the ones whose visitors are on Safari
 * and will never execute a line of it.
 *
 * The hook reports facts and no strings. Localising here would mean taking a
 * `labels` object as a dependency, and a consumer passing an inline one would
 * then tear the stream down and rebuild it on every render — a stall on every
 * keystroke elsewhere on the page. `toQualityMenu` and `videoErrorMessage` turn
 * these facts into text, at render time, where that is free.
 */

export type HlsAttachment = {
  /** The bitrate ladder as the playlist declares it. Empty on native playback. */
  renditions: VideoRendition[];
  /** `AUTO_QUALITY`, or the id of a rung the viewer has pinned. */
  activeQuality: string;
  setQuality: (id: string) => void;
  /** The rung actually playing, so an automatic menu entry can say which. */
  currentHeight: number | null;
  error: VideoErrorKind | null;
  /** Cleared once the manifest is parsed and playback can begin. */
  isLoading: boolean;
  /** Re-attaches from scratch. The only useful response to a network error. */
  retry: () => void;
};

/**
 * The element arrives as a ref, not as a value.
 *
 * A `<video>` is something this hook writes to — `src`, and `load()` on the way
 * out — and a DOM node held in `useState` is not a value React lets you mutate;
 * the compiler is entitled to assume state stays put. A ref is the holder that
 * permits writes, and reading it inside an effect is exactly where refs are
 * meant to be read.
 *
 * `isAttached` is the price of that: filling a ref triggers no render, so
 * without a signal this effect would run once, see `null`, and never look
 * again — a player that shows a poster and plays nothing, forever.
 */
export function useHls(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  source: VideoSource,
  isAttached: boolean,
): HlsAttachment {
  const [renditions, setRenditions] = React.useState<VideoRendition[]>([]);
  const [activeQuality, setActiveQuality] = React.useState<string>(AUTO_QUALITY);
  const [currentHeight, setCurrentHeight] = React.useState<number | null>(null);
  const [error, setError] = React.useState<VideoErrorKind | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [attempt, setAttempt] = React.useState(0);

  /**
   * The live instance, in a ref because `setQuality` has to reach it without
   * re-running the effect that made it. Re-running would destroy the stream and
   * start it again, which a viewer sees as a stall on a menu click.
   *
   * Typed structurally rather than as `Hls`: an hls.js type on a `useRef` would
   * be an hls.js type in this file's inferred exports.
   */
  const instance = React.useRef<{ currentLevel: number } | null>(null);

  const { src } = source;
  const kind = sourceKind(source);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setIsLoading(true);
    setRenditions([]);
    setCurrentHeight(null);
    setActiveQuality(AUTO_QUALITY);

    /** Plain `src`, for a media file and for the browsers that decode HLS. */
    const attachDirectly = () => {
      video.src = src;
      setIsLoading(false);
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    };

    if (kind === "progressive") return attachDirectly();

    /*
      hls.js wherever Media Source Extensions exist; the browser's own HLS only
      where hls.js cannot run, which in practice means iOS.

      The obvious ordering — ask `canPlayType("application/vnd.apple.mpegurl")`
      first and trust a truthy answer — does not work, and fails in the
      direction that hides itself. Measured on Chrome 143: it answers "maybe",
      which is Chrome answering "maybe" to almost everything, and a native-first
      player therefore hands the playlist to a browser with no HLS demuxer at
      all. `canPlayType` is a hint, not a capability.

      Asking about MSE instead is a real question with a real answer, and it is
      asked before the import rather than through `Hls.isSupported()` so that a
      device which cannot use hls.js does not download 150 kB to find out.

      What this costs: desktop Safari has MSE, so it gets hls.js rather than its
      own hardware-decoded path. Accepted deliberately — one code path that
      works everywhere beats two, one of which is chosen by a hint that lies.
      iOS keeps the native path, which is where hardware decoding actually
      decides battery life.

      Native playback exposes no rendition ladder and no per-request header
      hook, so on that path the quality menu is correctly absent and a stream
      behind an `Authorization` header cannot be played. Both are properties of
      the browser, not of this hook.
    */
    const mediaSource =
      typeof MediaSource !== "undefined" ||
      typeof (window as { ManagedMediaSource?: unknown }).ManagedMediaSource !== "undefined";

    if (!mediaSource) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) return attachDirectly();
      setError("unsupported");
      setIsLoading(false);
      return;
    }

    /*
      `cancelled` guards the async gap. Unmounting during the dynamic import
      would otherwise attach a player to a detached `<video>` with no teardown
      registered — the classic leak here, where a backgrounded tab goes on
      pulling segments for a lesson nobody is watching.
    */
    let cancelled = false;
    let teardown: (() => void) | null = null;

    void (async () => {
      let Hls: typeof import("hls.js").default;
      try {
        ({ default: Hls } = await import("hls.js"));
      } catch {
        if (cancelled) return;
        // A failed chunk fetch is a network problem, and retry is the right
        // affordance for it — the same one a failed manifest gets.
        setError("network");
        setIsLoading(false);
        return;
      }

      if (cancelled) return;

      // MSE exists, but hls.js still gets the last word: it also checks for the
      // specific codecs it needs, which presence of the API does not promise.
      if (!Hls.isSupported()) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          teardown = attachDirectly();
          return;
        }
        setError("unsupported");
        setIsLoading(false);
        return;
      }

      const hls = new Hls();
      instance.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setRenditions(
          (hls.levels ?? []).map((level, index) => ({
            id: String(index),
            height: level.height ?? null,
            bitrate: level.bitrate ?? null,
            name: level.name ?? null,
          })),
        );
        setIsLoading(false);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setCurrentHeight(hls.levels?.[data.level]?.height ?? null);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        // Only fatal errors reach the project. hls.js reports a great many
        // non-fatal ones that it then recovers from by itself, and surfacing
        // those would make a working player look broken.
        if (!data.fatal) return;
        setIsLoading(false);
        setError(data.type === Hls.ErrorTypes.NETWORK_ERROR ? "network" : "media");
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      teardown = () => {
        instance.current = null;
        hls.destroy();
      };
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [videoRef, isAttached, src, kind, attempt]);

  const setQuality = React.useCallback((id: string) => {
    setActiveQuality(id);
    if (!instance.current) return;
    // hls.js spells "automatic" as -1.
    instance.current.currentLevel = id === AUTO_QUALITY ? -1 : Number(id);
  }, []);

  const retry = React.useCallback(() => setAttempt((n) => n + 1), []);

  return { renditions, activeQuality, setQuality, currentHeight, error, isLoading, retry };
}


