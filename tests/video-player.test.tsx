import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VideoPlayer } from "@/components/ui/video-player";
import { englishPlayerLabels, formatTimecode, toQualityMenu } from "@/lib/video-source";
import {
  HlsStub,
  hlsInstances,
  hlsStubConfig,
  resetHlsStub,
} from "./fixtures/hls-stub";

/**
 * hls.js is replaced by `tests/fixtures/hls-stub.ts`, through a Vite alias in
 * `vitest.config.mts` rather than through `vi.mock`. The fixture explains why —
 * short version: the player loads the package with a dynamic `import()` from
 * inside an effect, and a per-file mock does not reach that call.
 */

/**
 * The instance the player built, once the dynamic import has resolved.
 *
 * Most tests below need hls.js attached before they can assert anything, so a
 * regression in how the player *chooses* hls.js fails all of them at once.
 * That is a shared precondition rather than overlapping coverage — the choice
 * has its own test — but it is worth saying so out loud here, because thirteen
 * anonymous `waitFor` timeouts point at nothing.
 */
async function attached() {
  await waitFor(
    () => {
      if (hlsInstances.length === 0) {
        throw new Error(
          "the player never attached hls.js — check the MSE/native routing in use-hls.ts",
        );
      }
    },
    { timeout: 500 },
  );
  return hlsInstances[hlsInstances.length - 1]!;
}

/** Announce a two-rung ladder, as a real manifest would. */
async function parseManifest(hls: HlsStub) {
  hls.levels = [
    { height: 360, bitrate: 800_000, name: null },
    { height: 720, bitrate: 2_400_000, name: null },
  ];
  await act(async () => {
    hls.emit(HlsStub.Events.MANIFEST_PARSED);
  });
}

const SOURCE = { src: "https://example.test/lesson.m3u8" };

// The control bar's sliders are Radix, and Radix measures its thumb.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as never;

/*
  jsdom has no Media Source Extensions, and the player reads their presence to
  decide between hls.js and the browser's own HLS. Left alone, every test here
  would take the iOS path and nothing would exercise hls.js at all — so the
  default is a browser that has MSE, and the one test about the other path
  removes it deliberately.
*/
globalThis.MediaSource ??= class {} as never;

beforeEach(() => {
  resetHlsStub();
  /*
    jsdom implements no playback at all: `play` and `pause` are missing rather
    than inert, `duration` is NaN, and `paused` is a getter frozen at true.

    That last one matters more than it looks. The player decides between play
    and pause by reading `paused`, so a stub that fires the events without
    moving `paused` makes a second space bar replay instead of pausing — which
    is not a bug in the player, but it does make a test of the player's toggle
    prove nothing. So `paused` moves with the calls, the way a media element's
    would.
  */
  Object.defineProperty(HTMLMediaElement.prototype, "paused", {
    configurable: true,
    writable: true,
    value: true,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn(function (this: HTMLMediaElement) {
      (this as { paused: boolean }).paused = false;
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    }),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: vi.fn(function (this: HTMLMediaElement) {
      (this as { paused: boolean }).paused = true;
      this.dispatchEvent(new Event("pause"));
    }),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function Player(props: Partial<React.ComponentProps<typeof VideoPlayer>> = {}) {
  return <VideoPlayer source={SOURCE} labels={englishPlayerLabels} {...props} />;
}

describe("VideoPlayer attaches and lets go", () => {
  it("hands the playlist to hls.js and attaches it to the video element", async () => {
    const { container } = render(<Player />);
    const hls = await attached();

    expect(hls.loadedSource).toBe(SOURCE.src);
    expect(hls.attachedTo).toBe(container.querySelector("video"));
  });

  it("destroys the hls.js instance on unmount", async () => {
    // The leak this exists for is silent and expensive: a player that is
    // unmounted without `destroy()` keeps its loader alive, so a backgrounded
    // tab goes on pulling segments for a lesson nobody is watching.
    const { unmount } = render(<Player />);
    const hls = await attached();
    expect(hls.destroyed).toBe(false);

    unmount();
    expect(hls.destroyed).toBe(true);
  });

  it("uses the browser's own HLS where hls.js cannot run, and downloads nothing", async () => {
    // iOS. The decision is made on Media Source Extensions rather than on
    // `canPlayType`, and it is made *before* the dynamic import — a device that
    // cannot use hls.js should not fetch 150 kB to discover that.
    const mediaSource = globalThis.MediaSource;
    const managed = (globalThis as { ManagedMediaSource?: unknown }).ManagedMediaSource;
    // Removing a global for the duration of one test.
    delete (globalThis as { MediaSource?: unknown }).MediaSource;
    delete (globalThis as { ManagedMediaSource?: unknown }).ManagedMediaSource;
    const canPlayType = vi
      .spyOn(HTMLMediaElement.prototype, "canPlayType")
      .mockReturnValue("maybe");

    const { container } = render(<Player />);
    await waitFor(() =>
      expect(container.querySelector("video")).toHaveAttribute("src", SOURCE.src),
    );
    expect(hlsInstances).toHaveLength(0);

    canPlayType.mockRestore();
    if (mediaSource) globalThis.MediaSource = mediaSource;
    if (managed) (globalThis as { ManagedMediaSource?: unknown }).ManagedMediaSource = managed;
  });

  it("prefers hls.js over the browser's hint that it might manage HLS itself", async () => {
    // The regression this exists for shipped and hid itself. Chrome answers
    // "maybe" to `canPlayType("application/vnd.apple.mpegurl")` — measured on
    // 143 — so a player that trusts that hint hands the playlist to a browser
    // with no HLS demuxer. It happened to play on the machine it was tested on,
    // which is the worst possible outcome for a wrong decision.
    const canPlayType = vi
      .spyOn(HTMLMediaElement.prototype, "canPlayType")
      .mockReturnValue("maybe");

    const { container } = render(<Player />);
    const hls = await attached();

    expect(hls.loadedSource).toBe(SOURCE.src);
    // hls.js drives the element through MSE, so the playlist URL must not be on
    // it: that would mean the native path won.
    expect(container.querySelector("video")).not.toHaveAttribute("src", SOURCE.src);

    canPlayType.mockRestore();
  });
});

describe("VideoPlayer reports playback without storing it", () => {
  it("calls onProgress on a cadence rather than on every frame", async () => {
    // `timeupdate` fires about four times a second. A project wiring this
    // straight to an API would send fourteen thousand requests an hour per
    // viewer, so the cadence is the contract, not an implementation detail.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onProgress = vi.fn();

    const { container } = render(<Player onProgress={onProgress} progressInterval={1000} />);
    const video = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "duration", { configurable: true, value: 100 });
    Object.defineProperty(video, "currentTime", { configurable: true, writable: true, value: 30 });

    // Nothing is reported while paused: a paused tab must cost nothing.
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(onProgress).not.toHaveBeenCalled();

    await act(async () => {
      video.dispatchEvent(new Event("play"));
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenLastCalledWith({
      currentTime: 30,
      duration: 100,
      percent: 0.3,
    });
  });

  it("calls onEnded when the media ends", async () => {
    const onEnded = vi.fn();
    const { container } = render(<Player onEnded={onEnded} />);
    const video = container.querySelector("video") as HTMLVideoElement;

    await act(async () => {
      video.dispatchEvent(new Event("ended"));
    });

    expect(onEnded).toHaveBeenCalledTimes(1);
  });
});

describe("VideoPlayer quality menu", () => {
  it("switches the hls.js level when a rung is chosen", async () => {
    const user = userEvent.setup();
    render(<Player />);
    const hls = await attached();
    await parseManifest(hls);

    await user.click(screen.getByRole("button", { name: englishPlayerLabels.quality }));
    // Highest first, so "720p" is the ladder's first entry after Auto.
    await user.click(await screen.findByRole("menuitemradio", { name: "720p" }));

    // hls.js indexes levels by their position in the manifest, so 720p — the
    // second entry there — is level 1 whatever order the menu shows.
    expect(hls.currentLevel).toBe(1);
  });

  it("offers no quality control when the stream has no ladder", async () => {
    // A single-rendition playlist has nothing to choose, and native playback
    // exposes no ladder at all. An empty menu is worse than no menu.
    render(<Player />);
    await attached();

    expect(
      screen.queryByRole("button", { name: englishPlayerLabels.quality }),
    ).not.toBeInTheDocument();
  });
});

describe("VideoPlayer keyboard control", () => {
  async function playerWithVideo() {
    const { container } = render(<Player />);
    const region = screen.getByRole("region", { name: englishPlayerLabels.player });
    const video = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "duration", { configurable: true, value: 100 });
    Object.defineProperty(video, "currentTime", {
      configurable: true,
      writable: true,
      value: 50,
    });
    await attached();
    region.focus();
    return { region, video };
  }

  it("plays and pauses on the space bar", async () => {
    const user = userEvent.setup();
    const { video } = await playerWithVideo();

    await user.keyboard(" ");
    expect(video.play).toHaveBeenCalled();

    await user.keyboard(" ");
    expect(video.pause).toHaveBeenCalled();
  });

  it("seeks five seconds on the left and right arrows", async () => {
    const user = userEvent.setup();
    const { video } = await playerWithVideo();

    await user.keyboard("{ArrowRight}");
    expect(video.currentTime).toBe(55);

    await user.keyboard("{ArrowLeft}");
    expect(video.currentTime).toBe(50);
  });

  it("moves the volume on the up and down arrows", async () => {
    const user = userEvent.setup();
    const { video } = await playerWithVideo();
    video.volume = 0.5;

    await user.keyboard("{ArrowDown}");
    expect(video.volume).toBeCloseTo(0.4);

    await user.keyboard("{ArrowUp}");
    expect(video.volume).toBeCloseTo(0.5);
  });

  it("mutes on M", async () => {
    const user = userEvent.setup();
    const { video } = await playerWithVideo();

    await user.keyboard("m");
    expect(video.muted).toBe(true);
  });

  it("asks for fullscreen on F", async () => {
    const user = userEvent.setup();
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });

    await playerWithVideo();
    await user.keyboard("f");

    expect(requestFullscreen).toHaveBeenCalled();
  });

  it("leaves keys it does not handle to the page", async () => {
    // The player takes focus to receive its shortcuts, so swallowing everything
    // would trap a keyboard user inside it.
    const user = userEvent.setup();
    const { region } = await playerWithVideo();

    const seen: string[] = [];
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.defaultPrevented) seen.push(event.key);
    };
    document.addEventListener("keydown", onKeyDown);

    await user.keyboard("{Tab}");
    await user.keyboard("j");
    region.focus();
    await user.keyboard(" ");

    document.removeEventListener("keydown", onKeyDown);
    expect(seen).toEqual(["Tab", "j"]);
  });
});

describe("VideoPlayer failure states", () => {
  it("offers a retry on a network error", async () => {
    render(<Player />);
    const hls = await attached();

    await act(async () => {
      hls.emit(HlsStub.Events.ERROR, { fatal: true, type: HlsStub.ErrorTypes.NETWORK_ERROR });
    });

    expect(screen.getByText(englishPlayerLabels.networkError)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: englishPlayerLabels.retry }),
    ).toBeInTheDocument();
  });

  it("stays quiet about the errors hls.js recovers from itself", async () => {
    // hls.js reports a great many non-fatal errors and then carries on. Showing
    // those would make a player that is working look broken.
    render(<Player />);
    const hls = await attached();

    await act(async () => {
      hls.emit(HlsStub.Events.ERROR, { fatal: false, type: HlsStub.ErrorTypes.NETWORK_ERROR });
    });

    expect(screen.queryByText(englishPlayerLabels.networkError)).not.toBeInTheDocument();
  });

  it("withholds retry when the format cannot be played at all", async () => {
    // Retrying an unsupported format re-runs the same failure. Offering the
    // button anyway trains people to distrust it.
    hlsStubConfig.supported = false;

    render(<Player />);
    await waitFor(() =>
      expect(screen.getByText(englishPlayerLabels.unsupportedError)).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: englishPlayerLabels.retry }),
    ).not.toBeInTheDocument();
  });
});

describe("VideoPlayer speaks through labels", () => {
  it("defaults every visible string to Vietnamese", async () => {
    render(<VideoPlayer source={SOURCE} />);
    await attached();

    expect(screen.getByRole("region", { name: "Trình phát video" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Phát" })).toBeInTheDocument();
  });

  it("accepts a partial override without losing the rest", async () => {
    render(<VideoPlayer source={SOURCE} labels={{ play: "Bắt đầu" }} />);
    await attached();

    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tắt tiếng" })).toBeInTheDocument();
  });
});

describe("video-source is the whole vocabulary", () => {
  it("renders a timecode a viewer can read, including the ones that are not numbers", () => {
    // `NaN` before metadata loads and `Infinity` on a live stream both reach
    // this function, and both render as "NaN:NaN" without a guard.
    expect(formatTimecode(0)).toBe("0:00");
    expect(formatTimecode(75)).toBe("1:15");
    expect(formatTimecode(3675)).toBe("1:01:15");
    expect(formatTimecode(Number.NaN)).toBe("0:00");
    expect(formatTimecode(Number.POSITIVE_INFINITY)).toBe("0:00");
  });

  it("orders the quality menu highest first, behind the automatic entry", () => {
    const menu = toQualityMenu(
      [
        { id: "0", height: 360, bitrate: 800_000, name: null },
        { id: "1", height: 1080, bitrate: 5_000_000, name: null },
        { id: "2", height: 720, bitrate: 2_400_000, name: null },
      ],
      englishPlayerLabels,
    );

    expect(menu.map((quality) => quality.label)).toEqual(["Auto", "1080p", "720p", "360p"]);
    // The id still points at the manifest position, which is what hls.js wants.
    expect(menu[1]?.id).toBe("1");
  });
});
