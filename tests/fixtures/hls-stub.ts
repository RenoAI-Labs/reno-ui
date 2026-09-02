/**
 * Stands in for hls.js in every test, by alias rather than by `vi.mock`.
 *
 * Two reasons it has to be an alias.
 *
 * The real package needs Media Source Extensions, which jsdom does not have, so
 * `Hls.isSupported()` answers false there and the player would only ever render
 * an unsupported-format error. Nothing about reno's own behaviour could be
 * observed.
 *
 * And `vi.mock("hls.js")` does not reach the call that matters. The player loads
 * the package with a dynamic `import()` inside an effect — deliberately, so a
 * project pays 150 kB only where a video plays — and a mock registered in a test
 * file does not apply to an `import()` evaluated from inside React's scheduler.
 * That was measured rather than assumed: in one test, the same module's loader
 * called directly returned the mock while the effect a few lines later got the
 * real package. An alias is resolved when Vite transforms the file, so it has no
 * such blind spot.
 *
 * The stub records what the player asked for, which is the part reno owns: that
 * a playlist is loaded, that a level switch reaches the right property, and
 * above all that `destroy()` is called when the player goes away.
 */

export type StubLevel = {
  height: number | null;
  bitrate: number | null;
  name: string | null;
};

/** Every instance built since the last `resetHlsStub()`, in order. */
export const hlsInstances: HlsStub[] = [];

/** Overridable, so a test can play the "this browser cannot" case. */
export const hlsStubConfig = { supported: true };

export function resetHlsStub() {
  hlsInstances.length = 0;
  hlsStubConfig.supported = true;
}

export class HlsStub {
  static Events = {
    MANIFEST_PARSED: "hlsManifestParsed",
    LEVEL_SWITCHED: "hlsLevelSwitched",
    ERROR: "hlsError",
  } as const;

  static ErrorTypes = {
    NETWORK_ERROR: "networkError",
    MEDIA_ERROR: "mediaError",
  } as const;

  static isSupported() {
    return hlsStubConfig.supported;
  }

  levels: StubLevel[] = [];
  currentLevel = -1;
  loadedSource: string | null = null;
  attachedTo: HTMLVideoElement | null = null;
  destroyed = false;

  private handlers = new Map<string, Array<(event: string, data: unknown) => void>>();

  constructor() {
    hlsInstances.push(this);
  }

  on(event: string, handler: (event: string, data: unknown) => void) {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  /** Drive the player from outside, the way the real package would. */
  emit(event: string, data: unknown = {}) {
    for (const handler of this.handlers.get(event) ?? []) handler(event, data);
  }

  loadSource(src: string) {
    this.loadedSource = src;
  }

  attachMedia(video: HTMLVideoElement) {
    this.attachedTo = video;
  }

  destroy() {
    this.destroyed = true;
  }
}

export default HlsStub;
