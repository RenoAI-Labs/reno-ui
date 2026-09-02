"use client";

import * as React from "react";

import { VideoPlayer } from "@/components/ui/video-player";
import type { PlaybackProgress } from "@/lib/video-source";

/**
 * The stream is a fixture in this repository, not a public test URL.
 *
 * `check:render` opens this page in Chrome and fails on a dirty console, so a
 * remote stream would make the gate depend on somebody else's uptime — the
 * class of flake that gets a gate switched off. Two segments rather than one,
 * so hls.js performs a real segment transition, and it carries an audio track so
 * the mute control does something. Regenerate with:
 *
 * ```
 * ffmpeg -f lavfi -i "testsrc2=size=320x180:rate=10:duration=6" \
 *        -f lavfi -i "sine=frequency=440:duration=6" \
 *        -c:v libx264 -profile:v main -pix_fmt yuv420p -g 10 -crf 34 \
 *        -c:a aac -b:a 24k -hls_time 3 -hls_playlist_type vod \
 *        -hls_segment_type fmp4 -hls_fmp4_init_filename init.mp4 \
 *        -hls_segment_filename public/media/sample-hls/seg%d.m4s \
 *        public/media/sample-hls/index.m3u8
 * ```
 */
const SOURCE = { src: "/media/sample-hls/index.m3u8" };

export default function VideoPlayerDemo() {
  const [progress, setProgress] = React.useState<PlaybackProgress | null>(null);
  const [ended, setEnded] = React.useState(false);

  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <VideoPlayer
        source={SOURCE}
        title="Bài 1 — Giới thiệu"
        onProgress={setProgress}
        // Two seconds rather than the five-second default, so the readout below
        // visibly updates while somebody is looking at the page.
        progressInterval={2000}
        onEnded={() => setEnded(true)}
      />
      <p className="text-sm text-muted-foreground">
        {progress
          ? `onProgress: ${progress.currentTime.toFixed(1)}s / ${progress.duration.toFixed(1)}s (${Math.round(progress.percent * 100)}%)`
          : "onProgress: chưa phát"}
        {ended ? " · onEnded đã bắn" : null}
      </p>
    </div>
  );
}
