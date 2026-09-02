"use client";

import * as React from "react";
import { html } from "@codemirror/lang-html";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";

import { cn } from "@/lib/utils";
import { renoCodeTheme } from "@/components/ui/code-editor/reno-theme";

/**
 * A syntax-highlighted source editor, for the places a `<textarea>` stops being
 * enough: raw-HTML tabs in a CMS, email templates, a snippet field in an admin.
 *
 * Two projects arrived at the same three packages independently
 * (`@uiw/react-codemirror` + `@codemirror/lang-html`), so this wraps that rather
 * than choosing anything.
 *
 * The wrapper is deliberately thinner than reno's other heavy-widget wrappers.
 * `DataGrid` and `Chart` hide their upstream entirely, because a project should
 * not have to learn TanStack or recharts to render a table or a bar. Here the
 * expensive surface is the *language* set, and CodeMirror has around forty of
 * them. Pre-wrapping all of them would be doing work nobody has asked for, in a
 * library whose scope is already the thing at risk — so `language` covers what
 * is proven, and `extensions` is the door out. That door is the reason adding a
 * language later is not a breaking change.
 */

/**
 * Languages this component ships highlighting for.
 *
 * One entry, and that is the honest state of the evidence: both source projects
 * edit HTML and nothing else. Anything else goes in through `extensions`.
 */
export type CodeEditorLanguage = "html";

const LANGUAGES: Record<CodeEditorLanguage, () => Extension> = {
  html: () => html(),
};

export type CodeEditorProps = {
  /** The source text. Controlled: pair it with `onChange`. */
  value: string;
  onChange?: (value: string) => void;
  /** Defaults to `html`, the only language with highlighting built in. */
  language?: CodeEditorLanguage;
  /**
   * Blocks editing while keeping the text selectable and reachable by keyboard.
   * A disabled-looking box nobody can focus is not read-only, it is unreadable.
   */
  readOnly?: boolean;
  /** Any CSS length. The editor scrolls inside it. */
  height?: string;
  /** Shown while the document is empty. */
  placeholder?: string;
  /**
   * The accessible name of the text box. Screen readers otherwise announce an
   * unlabelled multi-line field, which in a form of several is unusable.
   */
  label?: string;
  /**
   * Extra CodeMirror extensions — another language, a linter, a keymap.
   *
   * `unknown[]` rather than `Extension[]` on purpose: a CodeMirror type in a
   * public prop would make a CodeMirror major bump a breaking change for every
   * project consuming this file, which is the failure mode reno's other
   * wrappers exist to avoid. The cast is the project's to make:
   *
   * ```tsx
   * import { css } from "@codemirror/lang-css";
   * <CodeEditor value={v} onChange={setV} extensions={[css()]} />
   * ```
   */
  extensions?: unknown[];
  className?: string;
};

export function CodeEditor({
  value,
  onChange,
  language = "html",
  readOnly = false,
  height = "20rem",
  placeholder,
  label = "Trình soạn mã",
  extensions,
  className,
}: CodeEditorProps) {
  const editorExtensions = React.useMemo<Extension[]>(
    () => [
      renoCodeTheme,
      LANGUAGES[language](),
      // Long attribute lists and minified markup are the normal case here, and
      // a horizontal scrollbar hides the end of every one of them.
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": label }),
      ...((extensions ?? []) as Extension[]),
    ],
    [language, label, extensions],
  );

  return (
    <div
      data-slot="code-editor"
      className={cn(
        "overflow-hidden rounded-md border border-input focus-within:ring-[3px] focus-within:ring-ring/50",
        className,
      )}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        height={height}
        readOnly={readOnly}
        placeholder={placeholder}
        extensions={editorExtensions}
        /*
          `none`, not `light`. The two themes the package ships carry their own
          palettes, written into the package's JavaScript where
          `reno-tokens/no-raw-color` cannot see them — so an ERP screen would get
          an editor coloured like somebody else's product, silently.
        */
        theme="none"
        /*
          `syntaxHighlighting: false` for the same reason: the bundled basic
          setup registers CodeMirror's default highlight style, which is a
          hardcoded palette. It loses to ours at highlighting time, but it still
          injects its stylesheet into the page, which leaves dead rules from a
          foreign palette in every consuming project.
        */
        basicSetup={{ syntaxHighlighting: false }}
      />
    </div>
  );
}
