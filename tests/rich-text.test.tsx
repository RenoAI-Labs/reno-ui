import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { RichText } from "@/components/ui/rich-text";
import {
  englishRichTextLabels as en,
  normaliseYoutubeUrl,
  youtubeVideoId,
  type ToolbarGroup,
} from "@/lib/rich-text-value";

/**
 * TipTap runs for real here — it is ProseMirror on a contenteditable, and jsdom
 * carries enough of both. What it does not carry is geometry, so anything the
 * editor measures has to be stubbed or the first render throws out of a layout
 * read rather than failing an assertion.
 */
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;

  // ProseMirror asks the document what is under the pointer while handling a
  // click. jsdom has no such method, and the resulting TypeError escapes as an
  // unhandled error rather than a failed assertion.
  document.elementFromPoint ??= (() => null) as never;

  Range.prototype.getClientRects ??= (() => ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* () {},
  })) as never;
  Range.prototype.getBoundingClientRect ??= (() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })) as never;
});

/** The editable element. TipTap builds it in an effect, so it is awaited. */
async function editable() {
  return waitFor(() => screen.getByRole("textbox", { name: en.editor }));
}

function Harness({
  initial = "<p>Xin chào</p>",
  onHtml,
  ...props
}: {
  initial?: string;
  onHtml?: (html: string) => void;
} & Partial<React.ComponentProps<typeof RichText>>) {
  const [value, setValue] = React.useState(initial);
  return (
    <RichText
      value={value}
      onChange={(next) => {
        setValue(next);
        onHtml?.(next);
      }}
      labels={en}
      {...props}
    />
  );
}

describe("RichText reads and writes HTML", () => {
  it("renders the value it is given", async () => {
    render(<Harness initial="<p>Xin chào</p>" />);
    const box = await editable();
    expect(box).toHaveTextContent("Xin chào");
  });

  it("reports typing as HTML", async () => {
    const onHtml = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="<p>Xin chào</p>" onHtml={onHtml} />);

    const box = await editable();
    await user.click(box);
    await user.keyboard("!");

    expect(onHtml).toHaveBeenCalled();
    expect(onHtml.mock.calls.at(-1)?.[0]).toContain("Xin chào");
    expect(onHtml.mock.calls.at(-1)?.[0]).toMatch(/^<p>/);
  });

  it("adopts a value from outside without reporting it back", async () => {
    /*
      The defect this exists for is the classic one in a controlled editor:
      typing emits HTML, the parent hands it back as `value`, the sync sees a
      "new" value and replaces the document — and if replacing it emits in turn,
      the two chase each other forever.

      `onChange` is the instrument, not a render count. Adopting a value the
      project supplied is not a change the project needs telling about, so the
      correct number of calls is zero; a loop cannot produce zero.
    */
    const onChange = vi.fn();
    function Controlled({ value }: { value: string }) {
      return <RichText value={value} onChange={onChange} labels={en} />;
    }

    const { rerender } = render(<Controlled value="<p>Một</p>" />);
    const box = await editable();
    expect(box).toHaveTextContent("Một");

    rerender(<Controlled value="<p>Hai</p>" />);
    await waitFor(() => expect(box).toHaveTextContent("Hai"));

    // Give a loop time to show itself before declaring there is not one.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not adopt a new value while the author is typing into it", async () => {
    /*
      The guard that keeps a controlled editor usable, and the trade-off it
      buys, in one test.

      Why it exists: comparing the incoming value against what was emitted is
      not enough for a project that *normalises* before storing — collapsing
      whitespace is enough to break the comparison, and then `setContent` runs
      on every keystroke and drags the caret to the end of the document.
      Measured, with only the string comparisons: typing "xyz" into such a
      parent produced "xy".

      Why it is asserted this way rather than by typing: the typed version
      passes or fails depending on whether React flushes the parent between
      keystrokes, so it is a race, and a flaky gate is worse than none. The
      mechanism is deterministic — focus decides who wins — so the mechanism is
      what gets checked.
    */
    const user = userEvent.setup();
    function Controlled({ value }: { value: string }) {
      return <RichText value={value} onChange={() => {}} labels={en} />;
    }

    const { rerender } = render(<Controlled value="<p>Một</p>" />);
    const box = await editable();

    await user.click(box);
    rerender(<Controlled value="<p>Hai</p>" />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    // The author has the caret. Their document wins.
    expect(box).toHaveTextContent("Một");

    // Once they leave, the project's value applies.
    box.blur();
    rerender(<Controlled value="<p>Ba</p>" />);
    await waitFor(() => expect(box).toHaveTextContent("Ba"));
  });

  it("leaves the document alone when the value handed back is its own", async () => {
    // The echo case. The parent storing exactly what was emitted must not cause
    // a setContent, because setContent moves the caret.
    const onHtml = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="<p>abc</p>" onHtml={onHtml} />);

    const box = await editable();
    await user.click(box);
    await user.keyboard("de");

    // Both keystrokes landed in order, which they would not have if the caret
    // had been reset between them.
    expect(onHtml.mock.calls.at(-1)?.[0]).toContain("deabc");
  });
});

describe("RichText toolbar covers the agreed groups, and only those", () => {
  it("shows the five default groups and withholds align and media", async () => {
    render(<Harness />);
    await editable();

    /*
      Two roles, because the groups are two shapes. Several formats can be on at
      once, so those are pressable buttons; exactly one heading level can, so
      Radix renders that group as radios. Querying both is what proves the
      shapes are what they should be rather than what they happen to be.
    */
    for (const name of [en.bold, en.bulletList, en.link, en.undo]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("radio", { name: en.paragraph })).toBeInTheDocument();

    expect(screen.queryByRole("radio", { name: en.alignCenter })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.image })).not.toBeInTheDocument();
  });

  it("shows a group only when it is asked for", async () => {
    render(<Harness groups={["history"]} />);
    await editable();

    expect(screen.getByRole("button", { name: en.undo })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.bold })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.bulletList })).not.toBeInTheDocument();
  });

  it("renders a control from each of the seven groups when all are asked for", async () => {
    render(
      <Harness
        groups={["format", "heading", "list", "align", "link", "history", "media"]}
      />,
    );
    await editable();

    // One representative control per group, so a group that silently stops
    // rendering is caught rather than assumed.
    expect(screen.getByRole("button", { name: en.bold })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: en.heading(1) })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.orderedList })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: en.alignCenter })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.link })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.redo })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.youtube })).toBeInTheDocument();
  });

  it("applies a format command to the document", async () => {
    const onHtml = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="<p>abc</p>" onHtml={onHtml} />);

    const box = await editable();
    await user.click(box);
    // Select the paragraph, then embolden it.
    await user.keyboard("{Control>}a{/Control}");
    await user.click(screen.getByRole("button", { name: en.bold }));

    await waitFor(() => expect(onHtml.mock.calls.at(-1)?.[0]).toContain("<strong>"));
  });

  it("turns a paragraph into a heading and back", async () => {
    const onHtml = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="<p>abc</p>" onHtml={onHtml} />);

    await editable();
    // A radio, not a button: only one heading level can be active at a time.
    await user.click(screen.getByRole("radio", { name: en.heading(2) }));
    await waitFor(() => expect(onHtml.mock.calls.at(-1)?.[0]).toContain("<h2>"));

    await user.click(screen.getByRole("radio", { name: en.paragraph }));
    await waitFor(() => expect(onHtml.mock.calls.at(-1)?.[0]).toContain("<p>"));
  });
});

describe("RichText labels", () => {
  it("defaults every visible string to Vietnamese", async () => {
    render(<RichText defaultValue="<p>abc</p>" />);
    await waitFor(() => screen.getByRole("textbox", { name: "Trình soạn thảo" }));

    expect(screen.getByRole("button", { name: "Đậm" })).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Trình soạn thảo" })).toBeInTheDocument();
  });

  it("accepts a partial override without losing the rest", async () => {
    render(<RichText defaultValue="<p>abc</p>" labels={{ bold: "In đậm" }} />);
    await waitFor(() => screen.getByRole("textbox", { name: "Trình soạn thảo" }));

    expect(screen.getByRole("button", { name: "In đậm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nghiêng" })).toBeInTheDocument();
  });
});

describe("RichText read-only", () => {
  it("hides the toolbar and stops the document being edited", async () => {
    const onHtml = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="<p>abc</p>" onHtml={onHtml} readOnly />);

    const box = await editable();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    // Still readable and reachable: read-only is not the same as hidden.
    expect(box).toHaveTextContent("abc");

    await user.click(box);
    await user.keyboard("x");
    expect(onHtml).not.toHaveBeenCalled();
  });
});

describe("RichText media", () => {
  const withMedia = ["format", "media"] satisfies ToolbarGroup[];

  it("inserts an image by URL with no upload handler at all", async () => {
    // The default posture: reno-ui owns no storage, and an editor with no
    // upload infrastructure still has to be useful.
    const onHtml = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="<p>abc</p>" groups={withMedia} onHtml={onHtml} />);
    await editable();

    await user.click(screen.getByRole("button", { name: en.image }));
    await user.type(screen.getByLabelText(en.imageUrl), "https://cdn.test/anh.png");
    await user.type(screen.getByLabelText(en.imageAlt), "Ảnh minh hoạ");
    await user.click(screen.getByRole("button", { name: en.imageInsert }));

    await waitFor(() => {
      const html = onHtml.mock.calls.at(-1)?.[0] ?? "";
      expect(html).toContain('src="https://cdn.test/anh.png"');
      expect(html).toContain('alt="Ảnh minh hoạ"');
    });
  });

  it("hides the upload tab when there is nowhere to upload to", async () => {
    const user = userEvent.setup();
    render(<Harness groups={withMedia} />);
    await editable();

    await user.click(screen.getByRole("button", { name: en.image }));
    expect(screen.getByLabelText(en.imageUrl)).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: en.tabUpload })).not.toBeInTheDocument();
  });

  it("uploads through the project's handler and inserts what it returns", async () => {
    const onImageUpload = vi.fn().mockResolvedValue("https://cdn.test/uploaded.png");
    const onHtml = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="<p>abc</p>" groups={withMedia} onHtml={onHtml} onImageUpload={onImageUpload} />);
    await editable();

    await user.click(screen.getByRole("button", { name: en.image }));
    await user.click(screen.getByRole("tab", { name: en.tabUpload }));
    await user.upload(
      screen.getByLabelText(en.imageUpload),
      new File(["x"], "anh.png", { type: "image/png" }),
    );

    await waitFor(() =>
      expect(onHtml.mock.calls.at(-1)?.[0]).toContain('src="https://cdn.test/uploaded.png"'),
    );
    expect(onImageUpload).toHaveBeenCalledTimes(1);
  });

  it("says an upload failed instead of inserting a broken image", async () => {
    // A swallowed failure looks exactly like a slow network, and the author's
    // response to those two is different.
    const onImageUpload = vi.fn().mockRejectedValue(new Error("413"));
    const onHtml = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="<p>abc</p>" groups={withMedia} onHtml={onHtml} onImageUpload={onImageUpload} />);
    await editable();

    await user.click(screen.getByRole("button", { name: en.image }));
    await user.click(screen.getByRole("tab", { name: en.tabUpload }));
    await user.upload(
      screen.getByLabelText(en.imageUpload),
      new File(["x"], "anh.png", { type: "image/png" }),
    );

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(en.imageUploadFailed));
    // Nothing inserted: the document must not end up carrying a broken <img>.
    expect(onHtml.mock.calls.every(([html]) => !String(html).includes("<img"))).toBe(true);
  });

  it("embeds a YouTube video and refuses a link that is not one", async () => {
    const onHtml = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial="<p>abc</p>" groups={withMedia} onHtml={onHtml} />);
    await editable();

    await user.click(screen.getByRole("button", { name: en.youtube }));
    const field = screen.getByLabelText(en.youtubeUrl);

    // A plausible-looking URL that is not YouTube keeps the button disabled,
    // so the error is for a paste worth explaining rather than for every
    // half-typed character.
    await user.type(field, "https://vimeo.com/12345");
    expect(screen.getByRole("button", { name: en.youtubeInsert })).toBeDisabled();

    await user.clear(field);
    await user.type(field, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await user.click(screen.getByRole("button", { name: en.youtubeInsert }));

    await waitFor(() => expect(onHtml.mock.calls.at(-1)?.[0]).toContain("youtube"));
  });
});

describe("YouTube URLs, whichever one was copied", () => {
  const ID = "dQw4w9WgXcQ";

  it("recognises the three shapes a person can end up with", () => {
    // The address bar, the Share button, and an existing embed pasted back in.
    // Whoever copied the link had no idea which one they got.
    expect(youtubeVideoId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(youtubeVideoId(`https://youtu.be/${ID}`)).toBe(ID);
    expect(youtubeVideoId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
  });

  it("survives the noise a real copied link carries", () => {
    expect(youtubeVideoId(`https://www.youtube.com/watch?t=42&v=${ID}&feature=share`)).toBe(ID);
    expect(youtubeVideoId(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(youtubeVideoId(`  https://www.youtube.com/watch?v=${ID}  `)).toBe(ID);
  });

  it("stores one canonical URL whatever went in", () => {
    // So the same video is one string in the database rather than three.
    //
    // Deliberately not using the youtu.be form: recognising that shape is the
    // test above's job, and asserting it here too would make one mistake light
    // up two failures.
    const canonical = `https://www.youtube.com/watch?v=${ID}`;
    expect(normaliseYoutubeUrl(`https://www.youtube.com/embed/${ID}`)).toBe(canonical);
    expect(normaliseYoutubeUrl(`https://www.youtube.com/watch?t=9&v=${ID}`)).toBe(canonical);
    expect(normaliseYoutubeUrl("https://vimeo.com/12345678")).toBeNull();
  });

  it("refuses what is not a YouTube link", () => {
    for (const url of [
      "https://vimeo.com/12345678",
      "youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch",
      "not a url",
      "",
    ]) {
      expect(youtubeVideoId(url)).toBeNull();
    }
  });

  it("refuses a YouTube host reached over a scheme that is not the web", () => {
    /*
      The scheme check earns its place here rather than in the case above. A
      `javascript:` URL has no host to parse, so it is refused whether or not
      anything looks at the protocol — but `ftp:` is a scheme the URL parser
      treats as special, so it *does* produce `www.youtube.com` as a hostname
      and sails through a check that only looks at the host.
    */
    expect(youtubeVideoId(`ftp://www.youtube.com/watch?v=${ID}`)).toBeNull();
    expect(youtubeVideoId(`javascript:alert(1)//youtube.com/watch?v=${ID}`)).toBeNull();
  });
});

describe("what the schema keeps, and what it quietly drops", () => {
  /**
   * The contract doc claims a specific list. These assertions are where that
   * claim is checked, because the first draft of that list was wrong in three
   * places — `<h4>` survives, a `<table>` loses its markup but keeps its text,
   * and a bare `<iframe>` does not round-trip even though the editor's own
   * YouTube embed does.
   *
   * This matters more than a doc being tidy: a project whose stored HTML
   * contains something on the dropped list loses content the moment an author
   * opens the record.
   */
  async function roundTrip(html: string) {
    render(<RichText value={html} onChange={() => {}} labels={en} />);
    const boxes = await waitFor(() => screen.getAllByRole("textbox", { name: en.editor }));
    return boxes[boxes.length - 1]!.innerHTML;
  }

  it("keeps every element the toolbar can produce", async () => {
    const out = await roundTrip(
      `<h1>a</h1><h2>b</h2><h3>c</h3><p><strong>d</strong><em>e</em><u>f</u><s>g</s><code>h</code></p>` +
        `<ul><li>i</li></ul><ol><li>j</li></ol><blockquote>k</blockquote>` +
        `<p style="text-align:center">l</p><img src="/m.png" alt="m">`,
    );

    for (const tag of ["<h1>", "<h2>", "<h3>", "<strong>", "<em>", "<u>", "<s>", "<code>", "<ul>", "<ol>", "<li>", "<blockquote>", "<img"]) {
      expect(out).toContain(tag);
    }
    expect(out).toContain("text-align: center");
  });

  it("keeps the two elements it has no button for, rather than destroying content", async () => {
    // `<pre>` and `<hr>` have no toolbar button and survive anyway. So do h4-h6:
    // the heading extension's schema is wider than the three levels offered.
    // Dropping them would mean an author opening an old record silently loses
    // parts of it, which is worse than an element they cannot insert.
    const out = await roundTrip("<pre><code>x</code></pre><hr><h4>y</h4>");
    expect(out).toContain("<pre>");
    expect(out).toContain("<hr>");
    expect(out).toContain("<h4>");
  });

  it("drops a table's markup but keeps the words in it", async () => {
    const out = await roundTrip("<table><tr><td>cell</td></tr></table>");
    expect(out).not.toContain("<table");
    expect(out).toContain("cell");
  });

  it("drops a script and a video outright", async () => {
    const out = await roundTrip('<p>a</p><script>alert(1)</script><video src="/v.mp4"></video>');
    expect(out).not.toContain("script");
    expect(out).not.toContain("video");
    expect(out).toContain("a");
  });

  it("leaves a link's attributes as the author wrote them", async () => {
    // The kit adds `target="_blank" rel="noopener noreferrer nofollow"` to every
    // link by default, including internal ones. On a CMS that is wrong twice:
    // an internal link should not open a tab, and `nofollow` on your own pages
    // tells search engines not to follow your own site.
    const out = await roundTrip('<p><a href="/dang-ky">x</a></p>');
    expect(out).toContain('href="/dang-ky"');
    expect(out).not.toContain("target=");
    expect(out).not.toContain("nofollow");
  });
});
