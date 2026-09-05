"use client";

import * as React from "react";
import {
  PauseIcon,
  PlayIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * Audio player with a built-in control bar.
 *
 * `video-player` covers video (HLS, quality menu, fullscreen). None of
 * that applies to a track, and pulling hls.js in to play an mp3 is a bundle cost
 * for nothing — so this is a separate component over a plain `<audio>` element.
 *
 * No progress persistence: fire `onProgress` / `onEnded` and let the project
 * decide what to store, same contract as the video player.
 *
 * Written because AutoContent generates music as well as posts and images, and
 * a generated track has to be listenable on the content-item screen before it
 * can be approved.
 */

export type AudioPlayerLabels = {
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  volume: string;
  seek: string;
  speed: string;
  loading: string;
  error: string;
  player: string;
};

export const defaultAudioPlayerLabels: AudioPlayerLabels = {
  play: "Phát",
  pause: "Tạm dừng",
  mute: "Tắt tiếng",
  unmute: "Bật tiếng",
  volume: "Âm lượng",
  seek: "Tiến trình phát",
  speed: "Tốc độ phát",
  loading: "Đang tải audio…",
  error: "Không phát được audio này.",
  player: "Trình phát audio",
};

export const englishAudioPlayerLabels: AudioPlayerLabels = {
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  unmute: "Unmute",
  volume: "Volume",
  seek: "Seek",
  speed: "Playback speed",
  loading: "Loading audio…",
  error: "This audio could not be played.",
  player: "Audio player",
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

/** mm:ss, and h:mm:ss once past an hour. NaN before metadata arrives. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function AudioPlayer({
  className,
  src,
  title,
  labels: labelOverrides,
  onProgress,
  onEnded,
  ...props
}: Omit<React.ComponentProps<"div">, "onProgress"> & {
  src: string;
  /** Accessible name for the player region. Falls back to `labels.player`. */
  title?: string;
  labels?: Partial<AudioPlayerLabels>;
  /** Fires while playing. The project decides whether to store the position. */
  onProgress?: (position: number, duration: number) => void;
  onEnded?: () => void;
}) {
  const labels = React.useMemo(
    () => ({ ...defaultAudioPlayerLabels, ...labelOverrides }),
    [labelOverrides],
  );

  const ref = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const [position, setPosition] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const [speed, setSpeed] = React.useState<number>(1);

  // Đổi src thì đặt lại trạng thái NGAY LÚC RENDER, không dùng effect: gọi
  // setState trong effect gây render dây chuyền (react-hooks/set-state-in-effect).
  // Đây là mẫu "adjusting state when a prop changes" của React.
  const [lastSrc, setLastSrc] = React.useState(src);
  if (src !== lastSrc) {
    setLastSrc(src);
    setLoading(true);
    setFailed(false);
    setPosition(0);
  }

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length];
    setSpeed(next);
    if (ref.current) ref.current.playbackRate = next;
  };

  return (
    <div
      data-slot="audio-player"
      role="group"
      aria-label={title ?? labels.player}
      className={cn(
        "border-input bg-card flex items-center gap-3 rounded-md border p-2",
        className,
      )}
      {...props}
    >
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setLoading(false);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setPosition(el.currentTime);
          onProgress?.(el.currentTime, el.duration);
        }}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />

      {failed ? (
        <p className="text-destructive px-2 text-sm">{labels.error}</p>
      ) : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={loading}
            aria-label={playing ? labels.pause : labels.play}
            onClick={toggle}
          >
            {loading ? (
              <Spinner label={labels.loading} />
            ) : playing ? (
              <PauseIcon aria-hidden="true" />
            ) : (
              <PlayIcon aria-hidden="true" />
            )}
          </Button>

          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {formatTime(position)}
          </span>

          <Slider
            aria-label={labels.seek}
            value={[position]}
            min={0}
            max={duration || 1}
            step={0.1}
            disabled={loading}
            onValueChange={([next]) => {
              setPosition(next);
              if (ref.current) ref.current.currentTime = next;
            }}
            className="min-w-24 flex-1"
          />

          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {formatTime(duration)}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={labels.speed}
            className="tabular-nums"
            onClick={cycleSpeed}
          >
            {speed}x
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={muted || volume === 0 ? labels.unmute : labels.mute}
            onClick={() => {
              const next = !muted;
              setMuted(next);
              if (ref.current) ref.current.muted = next;
            }}
          >
            {muted || volume === 0 ? (
              <VolumeXIcon aria-hidden="true" />
            ) : (
              <Volume2Icon aria-hidden="true" />
            )}
          </Button>

          <Slider
            aria-label={labels.volume}
            value={[muted ? 0 : volume]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={([next]) => {
              setVolume(next);
              setMuted(next === 0);
              if (ref.current) {
                ref.current.volume = next;
                ref.current.muted = next === 0;
              }
            }}
            className="w-20 shrink-0"
          />
        </>
      )}
    </div>
  );
}

export { AudioPlayer };
