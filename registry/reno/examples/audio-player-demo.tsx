"use client";

import { AudioPlayer } from "@/components/ui/audio-player";

/*
  The source is served from this repository, not a CDN: a demo that fetches
  across the network turns someone else's outage into a red gate here, and the
  render check reads a failed request as a broken page.

  Regenerate public/media/sample-tone.wav with a 3s 440Hz tone:
    python3 -c "import wave,math,struct;r=16000;w=wave.open('public/media/sample-tone.wav','w');w.setnchannels(1);w.setsampwidth(2);w.setframerate(r);w.writeframes(b''.join(struct.pack('<h',int(12000*min(1,i/r/0.05,(3-i/r)/0.05)*math.sin(2*math.pi*440*i/r))) for i in range(int(r*3))));w.close()"

  The failed-source state is deliberately NOT demonstrated here. It can only be
  produced by a request that actually fails, and the demo pages are swept by a
  gate that fails on any console error - a page cannot both show that state and
  render clean. The state itself is the `onError` branch in audio-player.tsx.
*/
export default function AudioPlayerDemo() {
  return (
    <div className="flex flex-col gap-[var(--density-gap)]">
      <AudioPlayer title="Nhạc nền chiến dịch tháng 9" src="/media/sample-tone.wav" />
    </div>
  );
}
