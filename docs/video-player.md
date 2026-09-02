# VideoPlayer

`@reno/video-player` attaches an HLS stream to a `<video>` element and gives it a
control bar. It is a primitive: it plays one thing and knows nothing about why.

```tsx
import { VideoPlayer } from "@/components/ui/video-player";

<VideoPlayer
  source={{ src: lesson.playlistUrl }}
  title={lesson.title}
  onProgress={({ percent }) => save(lesson.id, percent)}
  onEnded={() => markComplete(lesson.id)}
/>;
```

## Where this stops, and what picks up

This is the line that keeps the component reusable, so it is written down rather
than left to judgement.

| | `@reno/video-player` | a `course-player` block |
|---|---|---|
| Job | attach HLS, draw controls | playlist, chapters, lesson progress, notes, quiz between segments |
| Knows about the course | nothing | everything |
| Layer | primitive | block |

An admin previewing an uploaded recording and a student working through a lesson
need the same player and completely different screens around it. Fold the course
into the player and the admin screen gets a playlist it has no use for; keep them
apart and the block composes the primitive.

Concretely: a learn screen with a sidebar of lessons, a progress ring and a notes
panel is a block. Do not port that shape into this file.

## It stores nothing

`onProgress` and `onEnded` report. Where a resume point is kept — or whether it
is kept at all — is the project's decision, because it involves a backend, an
identity for the viewer, and a policy about what "watched" means. None of those
belong to a component library.

`onProgress` fires on a cadence, not on every frame, and the default is every
five seconds (`progressInterval`). `timeupdate` fires roughly four times a
second; a project wiring this straight to an API would send about fourteen
thousand requests an hour per viewer. The timer runs only while playback is
actually running, so a paused tab costs nothing.

## hls.js wherever MSE exists, native only where it does not

The obvious rule — ask `canPlayType("application/vnd.apple.mpegurl")` and take
the native path on a truthy answer — is wrong, and wrong in the direction that
hides itself. Measured on Chrome 143: it answers `"maybe"`, which is Chrome
answering "maybe" to almost everything. A native-first player therefore hands the
playlist to a browser with no HLS demuxer, and whether anything appears depends
on the build. `canPlayType` is a hint, not a capability.

So the decision is made on Media Source Extensions, which is a real question with
a real answer, and it is asked *before* the dynamic import so a device that
cannot use hls.js does not download 150 kB to find out:

```
MSE present   -> hls.js          Chrome, Firefox, Edge, desktop Safari
MSE absent    -> native <video>  iOS
neither works -> unsupported error
```

**What this costs, stated rather than buried:** desktop Safari has MSE, so it
gets hls.js rather than its own hardware-decoded path. That is deliberate — one
path that works everywhere beats two, one of which is chosen by a hint that lies
— and iOS, where hardware decoding actually decides battery life, keeps the
native path.

Two consequences on the native path, both properties of the browser rather than
of this component:

- **No quality menu.** Native HLS exposes no rendition ladder, so there is
  nothing to choose from. The control renders only when a ladder exists, rather
  than rendering empty.
- **No `Authorization` header.** There is no per-request hook. A project serving
  segments through an authenticated route cannot use the native path; on iOS
  that means such a stream will not play. If you hit this, that is the gap — say
  so rather than working around it in application code.

`scripts/check-boundaries.mjs` fails if any file other than
`registry/reno/hooks/use-hls.ts` imports hls.js. That is what keeps an hls.js
type out of the props: a major version of hls.js is a change in that one file,
not a breaking change for every project that installed this one.

## Keyboard

The player takes focus (`role="region"`, `tabIndex=0`) and handles the five
shortcuts a viewer already knows from every other player:

| Key | Action |
|---|---|
| Space, K | play / pause |
| ← / → | back / forward five seconds |
| ↑ / ↓ | volume, ten percent a step |
| F | fullscreen |
| M | mute |

They are bound on the container, not on the document, so a player never steals
the space bar from a form elsewhere on the page. Keys the player does not handle
are left alone — otherwise Tab would be swallowed and a keyboard user trapped
inside it.

## Errors

Failures are reported as one of three kinds, because a project shows a different
thing for each: `network` (retry is worth offering, and is offered), `media` (the
file is bad — retrying replays the same failure), `unsupported` (the browser
cannot, and the retry button is deliberately withheld rather than shown and
useless).

Only fatal hls.js errors surface. The package reports a great many non-fatal ones
that it then recovers from by itself, and showing those would make a player that
is working look broken.

## The control bar sits below the picture

Overlaying it is the more fashionable arrangement and was the first attempt. An
overlay needs a scrim and light-on-dark text, and the token layer has `--overlay`
for the scrim but nothing to write on it with — there is no
`--overlay-foreground`. Adding one means five presets times two colour modes plus
a new contrast pair to keep passing forever, which is a change to the token
contract and not a component's decision to make.

So the bar sits on `--card`, where every colour it uses is already
contrast-checked across all four presets in both modes. If an overlaid bar is
wanted later, the token is the thing to decide first.

## Licensing: hls.js is Apache-2.0

It is the first non-MIT package in the registry. Apache-2.0 is permissive and
compatible with MIT, but unlike MIT it requires attribution notices to travel
with the work. reno-ui's `NOTICE` carries the entry, with the copyright lines
read from the package's own LICENSE file — including the second holder it names
for the two files it derives from video.js.

**A project that installs this component must carry `NOTICE` into its own
repository, and into anything it redistributes.** Step 4 of
[handover-checklist.md](./handover-checklist.md) says so as well, so it cannot be
missed at delivery. `npm run check:provenance` fails if an Apache-2.0 dependency
is not named in `NOTICE`.

## Out of scope

Said plainly rather than left to be discovered:

- **DRM.** No Encrypted Media Extensions, no Widevine or FairPlay key handling.
  Real work, not a switch.
- **Live streams.** They play, but there is no DVR window, no "go live" button,
  and the seek bar disables itself when the duration is `Infinity` rather than
  pretending to a length.
- **Subtitles and alternate audio tracks.** hls.js supports both; this component
  does not surface them yet. No project has asked.
- **Analytics.** `onProgress` is the hook; what is counted is the project's.
