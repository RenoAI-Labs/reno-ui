/**
 * Everything a project has to name to use the video player, and nothing that
 * comes from hls.js.
 *
 * This file is the boundary, and it is the same one `grid-state.ts` draws around
 * TanStack. An hls.js type reaching a public prop would put every consuming
 * project on hls.js's release timeline: their code would stop compiling on a
 * major bump they did not ask for, in a file they cannot change without
 * diverging from the registry. Keeping the vocabulary here means a major bump
 * is a change in `use-hls.ts` and nowhere else.
 *
 * Nothing in this file may import hls.js, not even as a type.
 * `scripts/check-boundaries.mjs` enforces that.
 */

/** How the browser should be asked to play a URL. */
export type VideoSourceKind = "hls" | "progressive";

export type VideoSource = {
  /** An HLS playlist (`.m3u8`) or a plain media file. */
  src: string;
  /**
   * Left out, this is detected from the URL. Worth setting explicitly when the
   * playlist is served from a route that does not end in `.m3u8` — a signed URL
   * or an API path — which detection cannot see.
   */
  kind?: VideoSourceKind;
  /** Still frame shown before playback starts. */
  poster?: string;
};

/** `.m3u8`, ignoring a query string or fragment. */
export function detectSourceKind(src: string): VideoSourceKind {
  const path = src.split(/[?#]/, 1)[0] ?? "";
  return /\.m3u8$/i.test(path) ? "hls" : "progressive";
}

export function sourceKind(source: VideoSource): VideoSourceKind {
  return source.kind ?? detectSourceKind(source.src);
}

/** The id of the automatic rendition, which is not one of the ladder's rungs. */
export const AUTO_QUALITY = "auto";

/**
 * One rung of the bitrate ladder, described in reno's terms rather than
 * hls.js's `Level`.
 */
export type VideoQuality = {
  /** Opaque; `AUTO_QUALITY` for the automatic rendition. */
  id: string;
  /** Ready to render — "720p", "1,2 Mbps", or the label the playlist carries. */
  label: string;
  /** Null when the playlist does not say. */
  height: number | null;
  /** Bits per second, null when the playlist does not say. */
  bitrate: number | null;
};

/** What `onProgress` reports. Emitted on a cadence, not on every frame. */
export type PlaybackProgress = {
  currentTime: number;
  /** `0` until the browser knows, which for a live stream is forever. */
  duration: number;
  /** `currentTime / duration`, clamped to 0–1; `0` while duration is unknown. */
  percent: number;
};

/**
 * Why playback stopped being possible.
 *
 * Three cases, because a project shows a different thing for each: retry is
 * worth offering for `network`, pointless for `unsupported`, and a support
 * question for `media`.
 */
export type VideoErrorKind = "network" | "media" | "unsupported";

/**
 * One rung as the player reads it off the playlist, before any string exists.
 *
 * Separate from `VideoQuality` so that `use-hls.ts` needs no labels at all: the
 * hook reports facts, this file turns them into text. That keeps a `labels`
 * object out of the hook's dependencies, where an inline one from a consumer
 * would tear the stream down and rebuild it on every render.
 */
export type VideoRendition = {
  id: string;
  height: number | null;
  bitrate: number | null;
  name: string | null;
};

/**
 * Every user-visible string the player can render.
 *
 * Same rule as the DataGrid: reno-ui depends on no i18n runtime, so strings are
 * data with Vietnamese defaults. A string literal inside the player's JSX is a
 * bug.
 */
export type PlayerLabels = {
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  volume: string;
  /** Accessible name of the seek bar. */
  seek: string;
  speed: string;
  /** The 1x entry in the speed menu. */
  normalSpeed: string;
  quality: string;
  /** The automatic entry in the quality menu. */
  autoQuality: string;
  /** e.g. (720) => "720p — tự động" */
  autoQualityAt: (height: number) => string;
  fullscreen: string;
  exitFullscreen: string;
  loading: string;
  retry: string;
  networkError: string;
  mediaError: string;
  unsupportedError: string;
  /** Accessible name of the player region when the project gives no title. */
  player: string;
};

export const defaultPlayerLabels: PlayerLabels = {
  play: "Phát",
  pause: "Tạm dừng",
  mute: "Tắt tiếng",
  unmute: "Bật tiếng",
  volume: "Âm lượng",
  seek: "Tiến trình phát",
  speed: "Tốc độ phát",
  normalSpeed: "Bình thường",
  quality: "Chất lượng",
  autoQuality: "Tự động",
  autoQualityAt: (height) => `Tự động (${height}p)`,
  fullscreen: "Toàn màn hình",
  exitFullscreen: "Thoát toàn màn hình",
  loading: "Đang tải video…",
  retry: "Thử lại",
  networkError: "Không tải được video. Kiểm tra kết nối rồi thử lại.",
  mediaError: "Không phát được video này.",
  unsupportedError: "Trình duyệt này không phát được định dạng video.",
  player: "Trình phát video",
};

export const englishPlayerLabels: PlayerLabels = {
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  unmute: "Unmute",
  volume: "Volume",
  seek: "Seek",
  speed: "Playback speed",
  normalSpeed: "Normal",
  quality: "Quality",
  autoQuality: "Auto",
  autoQualityAt: (height) => `Auto (${height}p)`,
  fullscreen: "Fullscreen",
  exitFullscreen: "Exit fullscreen",
  loading: "Loading video…",
  retry: "Retry",
  networkError: "The video could not be loaded. Check the connection and retry.",
  mediaError: "This video could not be played.",
  unsupportedError: "This browser cannot play the video format.",
  player: "Video player",
};

export function resolvePlayerLabels(
  overrides?: Partial<PlayerLabels>,
  base: PlayerLabels = defaultPlayerLabels,
): PlayerLabels {
  return overrides ? { ...base, ...overrides } : base;
}

/**
 * Seconds to a timecode, dropping the hours field when there are none.
 *
 * `NaN` and `Infinity` both turn up in practice — before metadata loads, and on
 * a live stream — and rendering either verbatim puts "NaN:NaN" on screen.
 */
export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

/** A rung's label, from whatever the playlist actually provided. */
export function qualityLabel(rendition: VideoRendition, fallback: string): string {
  if (rendition.height) return `${rendition.height}p`;
  if (rendition.name) return rendition.name;
  if (rendition.bitrate) return `${Math.round(rendition.bitrate / 1000)} kbps`;
  return fallback;
}

/**
 * The quality menu: the automatic entry, then the ladder highest first.
 *
 * Highest first because that is the order every player a viewer has already
 * used presents it in, and because the reason someone opens this menu is nearly
 * always to stop the automatic choice from picking something low.
 */
export function toQualityMenu(
  renditions: VideoRendition[],
  labels: PlayerLabels,
): VideoQuality[] {
  if (renditions.length === 0) return [];

  const rungs = [...renditions]
    .sort((a, b) => (b.height ?? b.bitrate ?? 0) - (a.height ?? a.bitrate ?? 0))
    .map((rendition) => ({
      id: rendition.id,
      label: qualityLabel(rendition, labels.quality),
      height: rendition.height,
      bitrate: rendition.bitrate,
    }));

  return [
    { id: AUTO_QUALITY, label: labels.autoQuality, height: null, bitrate: null },
    ...rungs,
  ];
}

/** The message for a failure kind. Every string still comes from `labels`. */
export function videoErrorMessage(kind: VideoErrorKind, labels: PlayerLabels): string {
  if (kind === "network") return labels.networkError;
  if (kind === "media") return labels.mediaError;
  return labels.unsupportedError;
}
