import * as React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorView } from "@codemirror/view";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { CodeEditor } from "@/components/ui/code-editor";

/**
 * CodeMirror runs in jsdom, but it measures the document constantly and jsdom's
 * `Range` has no geometry at all. Without these two stubs the editor throws out
 * of its measure loop on the first render, which surfaces as an unhandled error
 * rather than a failed assertion.
 */
beforeAll(() => {
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

const SOURCE = `<p class="lead">Xin chào</p>`;

/** The text box CodeMirror renders, which is where typing has to land. */
function contentOf(container: HTMLElement) {
  return container.querySelector(".cm-content") as HTMLElement;
}

/** Every stylesheet CodeMirror has injected into the document. */
function injectedCss() {
  return Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
}

describe("CodeEditor editing", () => {
  it("reports what the user typed", async () => {
    const onChange = vi.fn();
    const { container } = render(<CodeEditor value={SOURCE} onChange={onChange} />);

    const user = userEvent.setup();
    await user.click(contentOf(container));
    await user.keyboard("!");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe(`!${SOURCE}`);
  });

  it("refuses the edit when read-only, rather than only hiding the caret", async () => {
    // The cheap version of read-only is `editable={false}`, which drops
    // `contenteditable` and takes the text box out of the tab order with it —
    // the code becomes unreachable to a keyboard user instead of unwritable.
    // Read-only has to block the write and leave the reading alone.
    const onChange = vi.fn();
    const { container } = render(<CodeEditor value={SOURCE} onChange={onChange} readOnly />);

    const content = contentOf(container);
    expect(content).toHaveAttribute("contenteditable", "true");

    const user = userEvent.setup();
    await user.click(content);
    await user.keyboard("!");

    expect(onChange).not.toHaveBeenCalled();
    expect(content.textContent).toBe(SOURCE);
  });

  it("names the text box so a screen reader can announce it", () => {
    const { container } = render(<CodeEditor value={SOURCE} label="Nội dung HTML" />);
    const content = contentOf(container);
    expect(content).toHaveAttribute("role", "textbox");
    expect(content).toHaveAttribute("aria-label", "Nội dung HTML");
  });
});

describe("CodeEditor colours follow the preset", () => {
  /**
   * The promise here is the same one `<Button>` makes: switching preset
   * re-colours the component with no code change. For syntax highlighting that
   * promise is unusually easy to break, because CodeMirror's own palette lives
   * in the package's JavaScript — `reno-tokens/no-raw-color` scans this
   * repository's source and would never see it.
   *
   * jsdom cannot resolve `var()`, so these assert the structural property that
   * makes the promise hold: the syntax colours are token references, and
   * CodeMirror's default palette is not in the page at all.
   */

  it("writes every syntax colour as a token reference", () => {
    render(<CodeEditor value={SOURCE} />);
    const css = injectedCss();

    for (const token of [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "var(--muted-foreground)",
      "var(--destructive)",
    ]) {
      expect(css).toContain(token);
    }
  });

  it("keeps CodeMirror's own highlight palette out of the page", () => {
    // The literals of `defaultHighlightStyle`, which the bundled basic setup
    // registers unless it is switched off. It loses to ours at highlighting
    // time, so the visible bug is subtle: the rules are injected and dead, and
    // the first person to reorder the extensions gets a purple keyword in an
    // ERP screen.
    render(<CodeEditor value={SOURCE} />);
    const css = injectedCss();

    const defaultPalette = [
      "#708",
      "#219",
      "#164",
      "#a11",
      "#e40",
      "#00f",
      "#30a",
      "#085",
      "#167",
      "#256",
      "#00c",
      "#940",
      "#404740",
    ];
    // Matched with a trailing guard, not as a substring: `#256` is one of these
    // and it sits inside plenty of innocent six-digit colours, so a plain
    // `includes` makes this test fire on values that are nothing to do with
    // CodeMirror.
    const present = defaultPalette.filter((hex) =>
      new RegExp(`${hex}(?![0-9a-fA-F])`).test(css),
    );
    expect(present).toEqual([]);
  });

  it("actually applies the highlight classes, not just injects their rules", () => {
    // Injecting the stylesheet and wiring the highlighter are two separate
    // steps, and the first one alone satisfies both checks above: the rules are
    // in the page, nothing wears them, and the source renders as one flat run.
    //
    // Deliberately blind to which colour: a rule turning into a literal is the
    // check above's job, and asserting it here too would make one mistake
    // light up two tests.
    const { container } = render(<CodeEditor value={SOURCE} />);

    const colourClasses = Array.from(
      injectedCss().matchAll(/\.([^\s{,.]+)\s*\{\s*color:/g),
      (m) => m[1],
    );
    expect(colourClasses.length).toBeGreaterThan(0);

    const worn = colourClasses.filter(
      (cls) => container.querySelectorAll(`.cm-content [class~="${cls}"]`).length > 0,
    );
    expect(worn.length).toBeGreaterThan(0);
  });
});

describe("CodeEditor language surface", () => {
  it("takes an extension the project supplies, so a second language needs no reno release", () => {
    // The deliberate thin spot in an otherwise thick wrapper. CodeMirror has
    // around forty language packages and reno ships one, so this prop is the
    // reason adding a second later is not a breaking change — which is worth
    // nothing unless what goes in actually reaches the editor.
    //
    // A theme carrying an unmistakable value is the cheapest observable proof:
    // it can only appear in the page if the extension was applied.
    const { container } = render(
      <CodeEditor
        value={SOURCE}
        extensions={[EditorView.theme({ ".cm-content": { letterSpacing: "0.123px" } })]}
      />,
    );

    expect(contentOf(container)).toBeInTheDocument();
    expect(injectedCss()).toContain("0.123px");
  });
});
