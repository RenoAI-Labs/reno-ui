"use client";

import {
  GaugeIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PlayIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatTimecode, type PlayerLabels, type VideoQuality } from "@/lib/video-source";

import { QualityMenu } from "./quality-menu";

/**
 * The control bar, in a strip below the picture rather than floating over it.
 *
 * Overlaying it is the more fashionable arrangement and it was the first
 * attempt. It needs a scrim and light-on-dark text, and the token layer has
 * `--overlay` for the scrim but nothing to write on it with: there is no
 * `--overlay-foreground`. Adding one means five presets times two modes plus a
 * new contrast pair to keep passing forever — a change to the token contract,
 * which is not this component's decision to make. Reading tokens honestly is
 * worth more here than floating, so the bar sits on `--card` where every colour
 * it uses is already contrast-checked.
 */
export function ControlBar({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  playbackRate,
  playbackRates,
  onRateChange,
  qualities,
  activeQuality,
  onQualityChange,
  currentHeight,
  isFullscreen,
  onToggleFullscreen,
  labels,
}: {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  /** 0–1. */
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  playbackRate: number;
  playbackRates: number[];
  onRateChange: (rate: number) => void;
  qualities: VideoQuality[];
  activeQuality: string;
  onQualityChange: (id: string) => void;
  currentHeight: number | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  labels: PlayerLabels;
}) {
  // A live stream reports `Infinity`, and a video reports `NaN` until metadata
  // arrives. Both would make the seek bar's max meaningless, so seeking waits
  // until there is a real duration to seek within.
  const seekable = Number.isFinite(duration) && duration > 0;

  return (
    <div
      data-slot="video-player-controls"
      className="flex flex-col gap-[calc(var(--density-gap)*0.5)] border-t border-border bg-card px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)] text-card-foreground"
    >
      <div className="flex items-center gap-[calc(var(--density-gap)*0.5)]">
        <Slider
          aria-label={labels.seek}
          min={0}
          max={seekable ? duration : 1}
          step={0.1}
          value={[seekable ? Math.min(currentTime, duration) : 0]}
          disabled={!seekable}
          onValueChange={([next]) => {
            if (seekable && next !== undefined) onSeek(next);
          }}
        />
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {formatTimecode(currentTime)}
          {seekable ? ` / ${formatTimecode(duration)}` : null}
        </span>
      </div>

      <div className="flex items-center gap-[calc(var(--density-gap)*0.25)]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePlay}
          aria-label={isPlaying ? labels.pause : labels.play}
        >
          {isPlaying ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMute}
          aria-label={isMuted ? labels.unmute : labels.mute}
        >
          {isMuted || volume === 0 ? <VolumeXIcon aria-hidden /> : <Volume2Icon aria-hidden />}
        </Button>

        <Slider
          aria-label={labels.volume}
          className="w-20"
          min={0}
          max={1}
          step={0.05}
          value={[isMuted ? 0 : volume]}
          onValueChange={([next]) => {
            if (next !== undefined) onVolumeChange(next);
          }}
        />

        <div className="ms-auto flex items-center gap-[calc(var(--density-gap)*0.25)]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={labels.speed}>
                <GaugeIcon aria-hidden />
                <span className="font-mono tabular-nums">{playbackRate}×</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={String(playbackRate)}
                onValueChange={(value) => onRateChange(Number(value))}
              >
                {playbackRates.map((rate) => (
                  <DropdownMenuRadioItem key={rate} value={String(rate)}>
                    <span className={cn(rate === 1 && "font-medium")}>
                      {rate === 1 ? labels.normalSpeed : `${rate}×`}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <QualityMenu
            qualities={qualities}
            activeQuality={activeQuality}
            onQualityChange={onQualityChange}
            currentHeight={currentHeight}
            labels={labels}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
          >
            {isFullscreen ? <MinimizeIcon aria-hidden /> : <MaximizeIcon aria-hidden />}
          </Button>
        </div>
      </div>
    </div>
  );
}
