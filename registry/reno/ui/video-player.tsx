"use client";

import * as React from "react";

import { ErrorState } from "@/components/ui/error-state";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  resolvePlayerLabels,
  toQualityMenu,
  videoErrorMessage,
  type PlaybackProgress,
  type PlayerLabels,
  type VideoSource,
} from "@/lib/video-source";
import { useHls } from "@/hooks/use-hls";
import { ControlBar } from "@/components/ui/video-player/control-bar";

/**
 * An HLS-capable video player with a built-in control bar.
 *
 * **What this is not.** It knows nothing about courses. No playlist, no
 * chapters, no lesson progress, no notes, no quiz between segments — those
 * belong to a `course-player` block, which composes this. The boundary is
 * deliberate and it is the reason this component is reusable outside
 * e-learning: an admin previewing an uploaded recording and a student watching a
 * lesson need the same player and completely different screens around it.
 *
 * **It stores nothing.** `onProgress` and `onEnded` report; where a resume point
 * is kept, and whether it is kept at all, is the project's business. Storing it
 * here would mean choosing a backend on a project's behalf.
 *
 * **No hls.js type reaches these props.** `use-hls.ts` is the only file that
 * imports the package, and `check-boundaries.mjs` fails if that stops being
 * true. An hls.js major bump is therefore a change in one file rather than a
 * breaking change for every project that installed this one.
 *
 * Out of scope, said out loud rather than left to be discovered: DRM (no EME,
 * no Widevine or FairPlay key handling) and live-stream affordances (no DVR
 * window, no "go live"). Both are real work, not switches.
 */

export type VideoPlayerProps = {
  source: VideoSource;
  /** Accessible name for the player region. Falls back to `labels.player`. */
  title?: string;
  labels?: Partial<PlayerLabels>;
  /** Offered rates. The default covers what a lecture viewer reaches for. */
  playbackRates?: number[];
  /**
   * Reported on a cadence, not on every frame. `timeupdate` fires about four
   * times a second, and a project wiring this straight to an API would send
   * fourteen thousand requests an hour per viewer.
   */
  onProgress?: (progress: PlaybackProgress) => void;
  /** Milliseconds between `onProgress` calls. */
  progressInterval?: number;
  onEnded?: () => void;
  className?: string;
};

const DEFAULT_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_PROGRESS_INTERVAL = 5000;

/** How far the arrow keys move, in seconds — the step every player uses. */
const SEEK_STEP = 5;
/** How much the up/down arrows move the volume. */
const VOLUME_STEP = 0.1;

export function VideoPlayer({
  source,
  title,
  labels: labelOverrides,
  playbackRates = DEFAULT_RATES,
  onProgress,
  progressInterval = DEFAULT_PROGRESS_INTERVAL,
  onEnded,
  className,
}: VideoPlayerProps) {
  const labels = React.useMemo(() => resolvePlayerLabels(labelOverrides), [labelOverrides]);

  /**
   * The `<video>` element, in a ref with a boolean beside it.
   *
   * A ref alone will not do: `useHls` has to run again once the element exists,
   * and populating a ref triggers no render, so the hook would see `null`
   * forever and nothing would ever play. Plain state will not do either — the
   * player has to write to this element (`muted`, `volume`, `currentTime`,
   * `playbackRate`), and a value held in `useState` is not ours to mutate;
   * `react-hooks/immutability` says so, and it is right, because the compiler
   * is entitled to assume state does not change under it.
   *
   * So the element lives in the ref, which is the sanctioned mutable holder,
   * and `videoReady` exists only to buy the one extra render in which the ref
   * is populated.
   */
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const attachVideo = React.useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setVideoReady(node !== null);
  }, []);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const { renditions, activeQuality, setQuality, currentHeight, error, isLoading, retry } = useHls(
    videoRef,
    source,
    videoReady,
  );

  const qualities = React.useMemo(() => toQualityMenu(renditions, labels), [renditions, labels]);

  /** Media element state, mirrored into React so the bar can render it. */
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeEvent = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const onRateEvent = () => setPlaybackRate(video.playbackRate);
    const onEndedEvent = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("loadedmetadata", onDurationChange);
    video.addEventListener("volumechange", onVolumeEvent);
    video.addEventListener("ratechange", onRateEvent);
    video.addEventListener("ended", onEndedEvent);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("loadedmetadata", onDurationChange);
      video.removeEventListener("volumechange", onVolumeEvent);
      video.removeEventListener("ratechange", onRateEvent);
      video.removeEventListener("ended", onEndedEvent);
    };
  }, [videoReady, onEnded]);

  /**
   * `onProgress`, on a timer rather than on `timeupdate`.
   *
   * The timer runs only while playing, which is what makes a paused tab cost
   * nothing, and it reads the element directly so the interval does not need to
   * be re-created every time `currentTime` changes.
   */
  const progressRef = React.useRef(onProgress);
  React.useEffect(() => {
    progressRef.current = onProgress;
  }, [onProgress]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPlaying || !progressRef.current) return;

    const timer = setInterval(() => {
      const total = video.duration;
      const finite = Number.isFinite(total) && total > 0;
      progressRef.current?.({
        currentTime: video.currentTime,
        duration: finite ? total : 0,
        percent: finite ? Math.min(1, Math.max(0, video.currentTime / total)) : 0,
      });
    }, progressInterval);

    return () => clearInterval(timer);
  }, [videoReady, isPlaying, progressInterval]);

  /** Fullscreen is a document-level fact, so it is read from the document. */
  React.useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /*
    Every handler below reaches the element through the ref rather than through
    `video`. They are writing to it, and `video` is the value handed to
    `useHls` — mutating something already passed to a hook is exactly what
    `react-hooks/immutability` forbids, and for a good reason: the compiler is
    allowed to assume a hook's arguments do not change underneath it. The ref is
    the same node and is the holder that permits writes.
  */
  const togglePlay = React.useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setIsPlaying(false));
    else el.pause();
  }, []);

  const seekTo = React.useCallback((seconds: number) => {
    const el = videoRef.current;
    if (!el) return;
    const total = el.duration;
    const max = Number.isFinite(total) ? total : seconds;
    el.currentTime = Math.min(Math.max(0, seconds), max);
    // Written through immediately: `timeupdate` does not fire while paused, so
    // without this the bar would not move until playback resumed.
    setCurrentTime(el.currentTime);
  }, []);

  const changeVolume = React.useCallback((next: number) => {
    const el = videoRef.current;
    if (!el) return;
    const clamped = Math.min(1, Math.max(0, next));
    el.volume = clamped;
    // Dragging the slider up from zero means "let me hear it", so unmuting is
    // part of the same gesture.
    if (clamped > 0 && el.muted) el.muted = false;
  }, []);

  const toggleMute = React.useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
  }, []);

  const toggleFullscreen = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement === container) void document.exitFullscreen();
    else void container.requestFullscreen?.().catch(() => setIsFullscreen(false));
  }, []);

  const changeRate = React.useCallback((rate: number) => {
    const el = videoRef.current;
    if (el) el.playbackRate = rate;
  }, []);

  /**
   * The five shortcuts every viewer already knows: space, arrows, F, M.
   *
   * Bound on the container rather than the document, so a player never steals a
   * space bar from a form elsewhere on the page. Keys are read from `event.key`
   * except the arrows, and a modifier is left alone — Ctrl-F is the browser's.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const el = videoRef.current;
    if (!el) return;

    const handlers: Record<string, () => void> = {
      " ": togglePlay,
      k: togglePlay,
      ArrowRight: () => seekTo(el.currentTime + SEEK_STEP),
      ArrowLeft: () => seekTo(el.currentTime - SEEK_STEP),
      ArrowUp: () => changeVolume(el.volume + VOLUME_STEP),
      ArrowDown: () => changeVolume(el.volume - VOLUME_STEP),
      f: toggleFullscreen,
      m: toggleMute,
    };

    const handler = handlers[event.key] ?? handlers[event.key.toLowerCase()];
    if (!handler) return;

    // Only after a handler is found: an unhandled key must still reach the page,
    // and a swallowed Tab would trap focus inside the player.
    event.preventDefault();
    handler();
  };

  return (
    <div
      ref={containerRef}
      data-slot="video-player"
      // `region` plus a name is what lets a screen reader find and describe the
      // player as one thing; the shortcuts below need the focus, which is what
      // tabIndex is for.
      role="region"
      aria-label={title ?? labels.player}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-card focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <div className="relative aspect-video w-full bg-muted">
        <video
          ref={attachVideo}
          poster={source.poster}
          playsInline
          // No `controls`: the bar below is the control surface, and two sets of
          // controls on one video is worse than either alone.
          className="size-full"
        />

        {isLoading && !error ? (
          <div
            data-slot="video-player-loading"
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Spinner already carries role="status" and its own sr-only text,
                so the message goes through `label` rather than beside it. */}
            <Spinner label={labels.loading} />
          </div>
        ) : null}

        {error ? (
          <div data-slot="video-player-error" className="absolute inset-0 grid place-items-center p-4">
            <ErrorState
              body={videoErrorMessage(error, labels)}
              // Retrying an unsupported format re-runs the same failure. The
              // affordance is offered where it can work and withheld where it
              // cannot, rather than offered everywhere and disappointing.
              onRetry={error === "unsupported" ? undefined : retry}
              retryLabel={labels.retry}
            />
          </div>
        ) : null}
      </div>

      <ControlBar
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        currentTime={currentTime}
        duration={duration}
        onSeek={seekTo}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={changeVolume}
        onToggleMute={toggleMute}
        playbackRate={playbackRate}
        playbackRates={playbackRates}
        onRateChange={changeRate}
        qualities={qualities}
        activeQuality={activeQuality}
        onQualityChange={setQuality}
        currentHeight={currentHeight}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        labels={labels}
      />
    </div>
  );
}
