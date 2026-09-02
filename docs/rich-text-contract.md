# RichText contract

What goes into `@reno/rich-text`, what comes out, and what it is not
responsible for. The equivalent of
[data-grid-server-contract.md](./data-grid-server-contract.md) for the editor.

```tsx
import { RichText } from "@/components/ui/rich-text";

<RichText value={html} onChange={setHtml} />;
```

## The document is HTML

Not TipTap's JSON. Two reasons, and the second is the one that matters:

- Both projects this component was drawn from already store HTML.
- A column of HTML is still readable when the editor that wrote it is gone. That
  is the point of a handover — a delivered project should not need reno-ui, or
  TipTap, to make sense of its own data.

The cost is that a round trip is **normalising, not lossless**. HTML in is parsed
against the editor's schema, and anything the schema has no node or mark for is
dropped. What survives is what the seven toolbar groups can produce, plus what
the underlying kit brings with them:

| Kept | From |
|---|---|
| `<p>`, `<br>` | paragraph, hard break |
| `<h1>`–`<h3>` | heading group |
| `<strong>`, `<em>`, `<u>`, `<s>`, `<code>` | format group |
| `<ul>`, `<ol>`, `<li>`, `<blockquote>` | list group |
| `style="text-align:…"` on paragraphs and headings | align group |
| `<a href>` | link group |
| `<img src alt>` | media group |
| `<div data-youtube-video>` wrapping an `<iframe>` | media group |
| `<pre><code>`, `<hr>`, `<h4>`–`<h6>` | in the kit's schema, with no toolbar button |

The last row is worth reading twice, and it was measured rather than assumed —
the first draft of this table got it wrong. `<pre>`, `<hr>` and headings below
level 3 have no button and survive anyway, on purpose: a document that already
contains them would otherwise lose content the moment an author opened it, which
is a worse outcome than an element they cannot insert from the toolbar.

Dropped, in two different ways:

| Input | What happens |
|---|---|
| `<table>`, `<span>`, `<div>` | the element goes, **the text inside it stays**, as a paragraph |
| `<script>`, `<video>`, custom elements | gone entirely, content included |
| a bare `<iframe>` | gone. A YouTube embed round-trips only through the `<div data-youtube-video>` wrapper this editor writes |
| `class`, and inline `style` other than the alignment above | stripped |

A `<table>` losing its markup while keeping its words is the case most likely to
surprise: nothing errors, and the author watches their table become several
paragraphs. If a project needs tables preserved, that is a schema decision to
make deliberately rather than something to discover from a support ticket.

## Links keep the attributes the author wrote

The kit's link extension adds `target="_blank" rel="noopener noreferrer nofollow"`
to every link by default, `/dang-ky` included. That is switched off here, because
on a CMS it is wrong twice over: an internal link should not open a new tab, and
`nofollow` on your own pages tells search engines not to follow your own site. An
author who wants a new tab should be given a control for it; an author who did
not ask should get the link they typed.

Clicking a link inside the editor also does not navigate. The default does, which
takes the page away from the document being edited and loses unsaved work.

## This editor does not sanitize

**What `onChange` returns is what the author typed**, normalised by the schema
and nothing more. The schema is not a security boundary and was never designed
as one:

- It is enforced in the browser, which is under the author's control. A crafted
  request to your API never passes through it at all.
- It keeps `<a href>` and `<img src>` attribute values as written, including
  `javascript:` and `data:` URLs.
- It keeps `<iframe>` for YouTube embeds.

**Sanitize on the server, on the way in, every time.** Both source projects do,
and this is the classic stored-XSS shape: an editor that looks like it is
cleaning up, and a database that quietly accepts anything. Anything rendered
back to a browser needs escaping or a sanitizer on the server side of the API.

## The toolbar is seven groups, and stays seven

```ts
type ToolbarGroup =
  | "format"   // bold, italic, underline, strike, code
  | "heading"  // paragraph, h1, h2, h3
  | "list"     // bullet, ordered, blockquote
  | "align"    // left, centre, right
  | "link"     // add, edit, remove
  | "history"  // undo, redo
  | "media";   // image by URL or upload, YouTube embed
```

Default: `format`, `heading`, `list`, `link`, `history`. `align` is off because
alignment is a house-style decision many CMSs deliberately withhold from
authors, and `media` is off because it implies a story about where images live
that not every screen has.

**Explicitly out, and not "not yet":** tables, footnotes, mentions,
collaborative editing. This is the component in the library most likely to grow
without end, so the ceiling is enforced by a test that reads the union above:
an eighth group has to go past it, which is what makes adding one a decision.

**TipTap's Extension Pro packages are not used and must not be.** They are a
separate paid product under a commercial licence. Everything here is MIT, and
`npm run check:provenance` would reject a Pro package — but only after it had
already reached somebody's product, so the rule is stated here as well.

## Images: reno-ui owns no storage

```ts
onImageUpload?: (file: File) => Promise<string>;
```

- **Not passed** — the media dialog inserts images by URL only. Still useful,
  and needs no infrastructure at all.
- **Passed** — an upload tab appears. The project owns the bucket, the
  credentials, CORS, the signing scheme, the size quota and the virus scan. None
  of that belongs to a component library, and every one of them differs per
  project.

The handler returns the URL to insert. On rejection the dialog says the upload
failed and inserts nothing, so a failure never leaves a broken `<img>` in the
document.

**Anything this handler checks about the file runs in the browser.** File type
and size checks there are a convenience for the author, not a security control —
a request straight to the upload endpoint skips them entirely. The server has to
check again.

## YouTube: three shapes in, one shape stored

Whichever link the author copied is accepted, because they have no idea which
one they got:

```
https://www.youtube.com/watch?v=ID     the address bar
https://youtu.be/ID                    the Share button
https://www.youtube.com/embed/ID       an existing embed, pasted back
```

Also accepted: extra query parameters in any order (`?t=42&v=ID&feature=share`),
and the `m.` and `music.` hosts. All of them normalise to the canonical watch
URL before being stored, so one video is one string in the database.

Anything else is refused with a message rather than embedded as a blank frame —
including `javascript:` URLs that happen to contain the word youtube.

## Controlled, and the loop that has to be avoided

`value` + `onChange` is controlled; `defaultValue` alone is uncontrolled.

A controlled rich text editor has one classic defect: typing emits HTML, the
parent stores it and hands it back as `value`, the sync sees a "new" value and
replaces the document, and the caret is dragged to the end on every keystroke.

Three things prevent it here, and the third was found by measurement rather than
by reasoning. The editor ignores its own echo, and ignores a value equal to what
it already holds — but neither covers a project that **normalises before
storing**: the value handed back then never equals either string. Measured, with
only those two guards, typing "xyz" into a parent that collapses whitespace
produced "xy".

So the third guard is focus: **while the editor has focus, the author is
authoritative and an incoming `value` is not applied.**

The trade-off, stated rather than discovered:

- Setting `value` programmatically while someone is typing into the editor does
  not take effect until they leave it. Blur first if a reset has to land
  immediately.
- Loading a different record works normally, because nobody is typing into the
  editor at that moment.
- **Collaborative editing is out of scope**, and this is part of why: a remote
  edit arriving while the local author types is exactly the case this guard
  refuses to handle. It is out, not nearly working.

Whatever happens, `value` changing to something the editor did not emit replaces
the document and resets the selection. That is correct for loading a different
record and wrong for reformatting the current one, so do not round-trip `value`
through a formatter while the author is typing.

## Styling

Typography for the document is written in tokens, on the content element, rather
than through a `prose` plugin: reno-ui ships no Tailwind plugins, and a project
that has one would end up with two competing sets of rules. The rules cover
exactly the elements listed in the table above. Restyling is a `className`
change in `rich-text.tsx`, which is the project's own file after install.
