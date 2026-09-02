"use client";

import * as React from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";

import {
  normaliseYoutubeUrl,
  type HeadingLevel,
  type RichTextValue,
  type TextAlign as TextAlignValue,
} from "@/lib/rich-text-value";

/**
 * The only file in the registry that touches TipTap.
 *
 * Everything above it speaks the vocabulary of `rich-text-value.ts`, so a
 * TipTap major version is a change here and nowhere else — the same containment
 * `use-data-grid.ts` gives TanStack and `use-hls.ts` gives hls.js.
 * `scripts/check-boundaries.mjs` fails if any other file imports `@tiptap/*`.
 *
 * That is also why the rendered document comes back as `content`, a ready-made
 * node, rather than as an editor instance for the component to render itself:
 * `<EditorContent>` is a TipTap component, and handing it upwards would put a
 * TipTap import in `rich-text.tsx`.
 *
 * **Extension Pro is not used and must not be.** TipTap's paid extensions are
 * separate packages under a commercial licence. Everything here is MIT, and the
 * dependency-license gate would fail on a Pro package — but by then it would be
 * in someone's product. See `docs/rich-text-contract.md`.
 */

/** What the toolbar can ask the document to do. Closed, like the group list. */
export type RichTextCommands = {
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrike: () => void;
  toggleCode: () => void;

  /** `null` sets a plain paragraph. */
  setHeading: (level: HeadingLevel | null) => void;

  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  toggleBlockquote: () => void;

  setAlign: (align: TextAlignValue) => void;

  /** Applies to the selection, or to the text inserted when there is none. */
  setLink: (href: string, text?: string) => void;
  unsetLink: () => void;

  insertImage: (src: string, alt?: string) => void;
  /** Accepts any recognised YouTube URL; returns false if it is not one. */
  insertYoutube: (url: string) => boolean;

  undo: () => void;
  redo: () => void;
};

/** What the toolbar needs in order to show which buttons are active. */
export type RichTextEditorState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
  heading: HeadingLevel | null;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  align: TextAlignValue;
  /** The href under the cursor, so the link dialog can open pre-filled. */
  linkHref: string | null;
  /** Text currently selected, so the link dialog can offer to keep it. */
  selectedText: string;
  canUndo: boolean;
  canRedo: boolean;
};

export type UseRichTextOptions = {
  /** Controlled. Leave undefined and pass `defaultValue` for uncontrolled. */
  value?: RichTextValue;
  defaultValue?: RichTextValue;
  onChange?: (value: RichTextValue) => void;
  editable?: boolean;
  /** Accessible name of the editable region. */
  label: string;
  /** Applied to the editable element; the caller owns typography. */
  contentClassName?: string;
};

const EMPTY_STATE: RichTextEditorState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
  heading: null,
  bulletList: false,
  orderedList: false,
  blockquote: false,
  align: "left",
  linkHref: null,
  selectedText: "",
  canUndo: false,
  canRedo: false,
};

const NO_OP_COMMANDS: RichTextCommands = {
  toggleBold: () => {},
  toggleItalic: () => {},
  toggleUnderline: () => {},
  toggleStrike: () => {},
  toggleCode: () => {},
  setHeading: () => {},
  toggleBulletList: () => {},
  toggleOrderedList: () => {},
  toggleBlockquote: () => {},
  setAlign: () => {},
  setLink: () => {},
  unsetLink: () => {},
  insertImage: () => {},
  insertYoutube: () => false,
  undo: () => {},
  redo: () => {},
};

export function useRichText({
  value,
  defaultValue,
  onChange,
  editable = true,
  label,
  contentClassName,
}: UseRichTextOptions) {
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      /*
        StarterKit v3 already carries bold, italic, strike, code, underline,
        heading, both lists, blockquote, link and undo/redo — the five default
        groups — so the three below are the whole difference between it and the
        agreed feature list.
      */
      StarterKit.configure({
        /*
          Two of the link extension's defaults rewrite what the author wrote,
          and both were measured rather than assumed.

          It adds `target="_blank" rel="noopener noreferrer nofollow"` to every
          link — including `/dang-ky`. On a CMS that is wrong twice over: an
          internal link should not open a tab, and `nofollow` on your own pages
          tells search engines not to follow your own site. An author who wants
          a new tab can be given a control for it; an author who did not ask
          should get the link they typed.

          `openOnClick` means clicking a link inside the editor navigates the
          page away from the document being edited, which loses unsaved work.
        */
        link: {
          openOnClick: false,
          HTMLAttributes: { target: null, rel: null },
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Youtube.configure({ controls: true, nocookie: true }),
    ],
    content: value ?? defaultValue ?? "",
    editable,
    // Next renders this on the server first, and TipTap's default immediate
    // render produces markup the client then disagrees with — a hydration
    // mismatch on every page carrying an editor.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        ...(contentClassName ? { class: contentClassName } : {}),
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChangeRef.current?.(instance.getHTML());
    },
  });

  /**
   * Controlled sync: only a value from somewhere else reaches `setContent`.
   *
   * Two guards, and the second is the one that took a measurement to find.
   *
   * Comparing the incoming value against the document covers a project that
   * stores exactly what was emitted. It does not cover a project that
   * *normalises* before storing — collapsing whitespace is enough — because the
   * value handed back then never equals what the editor holds, `setContent`
   * runs on every keystroke, and the caret is dragged to the end of the
   * document. Measured, with only that comparison: typing "xyz" into a
   * normalising parent produced "xy".
   *
   * So while the editor has focus, the author is authoritative and an incoming
   * value is not applied. The trade is explicit: setting `value`
   * programmatically while someone is typing into the editor will not take
   * effect until they leave it. That is the right way round — losing a
   * keystroke is a bug the author sees immediately, and a deliberate
   * programmatic reset mid-typing is rare and can blur first. It is also why
   * collaborative editing is out of scope rather than nearly working.
   *
   * An earlier draft also remembered the last HTML emitted, in order to ignore
   * the project's echo of it. That was removed: it covered a strict subset of
   * what comparing against the document covers, and needed a ref to do it.
   *
   * The remaining comparison is an optimisation rather than a guard, and is
   * kept as one honestly — removing it turns no test red, because replacing a
   * document with an identical document is not observable. What it avoids is a
   * needless rebuild when a project echoes the HTML back after the author has
   * already moved on.
   */
  React.useEffect(() => {
    if (!editor || value === undefined) return;
    if (value === editor.getHTML()) return;
    if (editor.isFocused) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  React.useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  /**
   * `useEditorState` rather than a re-render on every transaction: the toolbar
   * needs to know which buttons are active, and that changes on cursor moves,
   * not only on edits. Recomputing this slice is what keeps the whole editor
   * from re-rendering on each keystroke.
   */
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }): RichTextEditorState => {
      if (!instance) return EMPTY_STATE;

      const heading = ([1, 2, 3] as HeadingLevel[]).find((level) =>
        instance.isActive("heading", { level }),
      );

      const align = (["center", "right"] as TextAlignValue[]).find((value) =>
        instance.isActive({ textAlign: value }),
      );

      const { from, to } = instance.state.selection;

      return {
        bold: instance.isActive("bold"),
        italic: instance.isActive("italic"),
        underline: instance.isActive("underline"),
        strike: instance.isActive("strike"),
        code: instance.isActive("code"),
        heading: heading ?? null,
        bulletList: instance.isActive("bulletList"),
        orderedList: instance.isActive("orderedList"),
        blockquote: instance.isActive("blockquote"),
        align: align ?? "left",
        linkHref: (instance.getAttributes("link").href as string | undefined) ?? null,
        selectedText: instance.state.doc.textBetween(from, to, " "),
        canUndo: instance.can().undo(),
        canRedo: instance.can().redo(),
      };
    },
  });

  const commands = React.useMemo<RichTextCommands>(() => {
    if (!editor) return NO_OP_COMMANDS;
    // Every command re-focuses first. Without it, clicking a toolbar button
    // moves focus to the button and the command applies to a selection the user
    // can no longer see.
    const chain = () => editor.chain().focus();

    return {
      toggleBold: () => chain().toggleBold().run(),
      toggleItalic: () => chain().toggleItalic().run(),
      toggleUnderline: () => chain().toggleUnderline().run(),
      toggleStrike: () => chain().toggleStrike().run(),
      toggleCode: () => chain().toggleCode().run(),

      setHeading: (level) =>
        level === null
          ? chain().setParagraph().run()
          : chain().setHeading({ level }).run(),

      toggleBulletList: () => chain().toggleBulletList().run(),
      toggleOrderedList: () => chain().toggleOrderedList().run(),
      toggleBlockquote: () => chain().toggleBlockquote().run(),

      setAlign: (align) => chain().setTextAlign(align).run(),

      setLink: (href, text) => {
        const { empty } = editor.state.selection;
        if (empty) {
          // Nothing selected: insert the text, then link what was inserted.
          const label = text?.trim() || href;
          chain()
            .insertContent({ type: "text", text: label, marks: [{ type: "link", attrs: { href } }] })
            .run();
          return;
        }
        chain().extendMarkRange("link").setLink({ href }).run();
      },
      unsetLink: () => chain().extendMarkRange("link").unsetLink().run(),

      insertImage: (src, alt) => chain().setImage({ src, alt }).run(),
      insertYoutube: (url) => {
        const normalised = normaliseYoutubeUrl(url);
        if (!normalised) return false;
        chain().setYoutubeVideo({ src: normalised }).run();
        return true;
      },

      undo: () => chain().undo().run(),
      redo: () => chain().redo().run(),
    };
  }, [editor]);

  /**
   * The document, already rendered. A node rather than an editor instance so no
   * TipTap import is needed above this file.
   */
  const content = React.useMemo(
    () => (editor ? React.createElement(EditorContent, { editor }) : null),
    [editor],
  );

  return { content, commands, state: state ?? EMPTY_STATE, isReady: editor !== null };
}
