"use client";

import { AudioPlayer } from "@/components/ui/audio-player";

export default function AudioPlayerDemo() {
  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <AudioPlayer
        title="Nhạc nền chiến dịch tháng 9"
        src="https://cdn.freesound.org/previews/635/635964_11861866-lq.mp3"
      />
      <AudioPlayer title="Nguồn hỏng" src="https://example.invalid/khong-ton-tai.mp3" />
    </div>
  );
}
