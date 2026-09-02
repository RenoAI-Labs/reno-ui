import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * The editor's colours, written in tokens.
 *
 * CodeMirror ships its own light and dark themes, and using either would put a
 * second palette inside a library whose whole premise is that one palette drives
 * four domains. Worse, that palette lives in the package's JavaScript, so
 * `reno-tokens/no-raw-color` cannot see it: an ERP screen would render an
 * editor coloured like somebody else's product and no gate would say a word.
 *
 * So every colour below is a `var(--...)` reference and nothing here decides
 * what a colour is. Switching preset re-colours the editor, syntax included,
 * with no code change — which is the same promise `<Button>` makes.
 *
 * The syntax colours borrow the chart ramp. It is the only set of tokens a
 * preset defines specifically to be distinguishable from one another, which is
 * exactly what syntax highlighting needs; inventing `--code-tag`,
 * `--code-string` and the rest would mean five new tokens per preset, five more
 * contrast pairs to keep passing, and a second opinion about hue in every
 * theme file.
 */

/**
 * Tag colours. The mapping is deliberately coarse — six roles, not thirty —
 * because a token that only appears in a language reno does not ship is a
 * colour nobody can see.
 */
const highlightStyle = HighlightStyle.define([
  // Element and tag names: the structure a reader scans for first.
  { tag: [tags.tagName, tags.heading], color: "var(--chart-1)" },
  // Attribute names, property names, variables.
  {
    tag: [tags.attributeName, tags.propertyName, tags.variableName],
    color: "var(--chart-2)",
  },
  // Strings, attribute values, links, inserted text.
  {
    tag: [tags.string, tags.attributeValue, tags.link, tags.inserted],
    color: "var(--chart-3)",
  },
  // Keywords, operators and the punctuation that opens a construct.
  {
    tag: [tags.keyword, tags.operator, tags.modifier, tags.self],
    color: "var(--chart-4)",
  },
  // Numbers, booleans, entities — the literal values.
  {
    tag: [tags.number, tags.bool, tags.atom, tags.character, tags.escape],
    color: "var(--chart-5)",
  },
  // Comments, doctype and bracket punctuation recede.
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment, tags.meta],
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },
  { tag: [tags.punctuation, tags.bracket, tags.separator], color: "var(--muted-foreground)" },
  { tag: tags.invalid, color: "var(--destructive)" },
]);

/**
 * Chrome around the text: gutter, cursor, selection, active line.
 *
 * Two things make this longer than it looks like it should be.
 *
 * The first is that CodeMirror always mounts a base theme, and it picks the
 * light or the dark variant from a facet nothing here can set correctly —
 * whether reno is in dark mode is a CSS fact, decided by a class on `<html>`,
 * and by the time this module runs there is nothing to read. So the base light
 * variant is always what is underneath, and every surface it colours has to be
 * overridden or a light-grey gutter turns up inside a dark editor.
 *
 * The second is specificity. Several base rules are more specific than the
 * obvious override — the focused selection is
 * `&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground`,
 * and a plain `.cm-selectionBackground` loses to it silently. Where a selector
 * below looks needlessly long, it is matching a base rule shape on purpose.
 *
 * Density tokens drive the type scale for the same reason they drive control
 * heights: an ERP screen wants more lines on the page than an e-learning one,
 * and that should not be a prop.
 */
const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    fontSize: "var(--density-font-size)",
  },
  ".cm-content": {
    fontFamily: "var(--font-mono)",
    lineHeight: "var(--density-line-height)",
    caretColor: "var(--foreground)",
    padding: "var(--density-cell-padding-y) 0",
  },
  // The focus ring is drawn on the wrapper, which is what a user reads as "the
  // editor"; CodeMirror's own dotted outline would sit inside the border.
  "&.cm-focused": { outline: "none" },

  ".cm-gutters": {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
    borderInlineEnd: "1px solid var(--border)",
    fontFamily: "var(--font-mono)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 var(--density-cell-padding-x)",
  },
  ".cm-activeLine": { backgroundColor: "var(--accent)" },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },

  ".cm-cursor, .cm-dropCursor": { borderInlineStartColor: "var(--foreground)" },
  ".cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--accent)",
  },
  // The long form: the base theme's focused-selection rule carries five
  // classes, so the short selector never applies while the editor has focus.
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    backgroundColor: "var(--accent)",
  },
  ".cm-selectionMatch": { backgroundColor: "var(--accent)" },
  ".cm-searchMatch": { backgroundColor: "var(--muted)" },
  ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "var(--accent)" },

  // Bracket matching only renders while focused, and the base rule says so —
  // matching that shape is what makes this win.
  "&.cm-focused .cm-matchingBracket": {
    backgroundColor: "var(--muted)",
    outline: "1px solid var(--border)",
  },
  "&.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: "var(--muted)",
    outline: "1px solid var(--destructive)",
  },

  ".cm-foldPlaceholder": {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
    border: "1px solid var(--border)",
  },
  ".cm-placeholder": { color: "var(--muted-foreground)" },
  ".cm-snippetField": { backgroundColor: "var(--muted)" },

  // The search panel, reachable from the default keymap. Its buttons and text
  // field are the base theme's most obviously foreign surfaces: a two-stop grey
  // gradient and a mid-grey border, both of which read as somebody else's
  // widget dropped into the page.
  ".cm-panels": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
  },
  ".cm-panels-top": { borderBottom: "1px solid var(--border)" },
  ".cm-panels-bottom": { borderTop: "1px solid var(--border)" },
  ".cm-button": {
    backgroundImage: "none",
    backgroundColor: "var(--secondary)",
    color: "var(--secondary-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
  },
  ".cm-button:active": {
    backgroundImage: "none",
    backgroundColor: "var(--muted)",
  },
  ".cm-textfield": {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    border: "1px solid var(--input)",
    borderRadius: "var(--radius-sm)",
  },

  // The completion popup. `lang-html` completes tag and attribute names, so
  // this is on the normal path, not an edge case.
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },
  ".cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
  },
});

/** The editor's look, as one extension. */
export const renoCodeTheme: Extension = [editorTheme, syntaxHighlighting(highlightStyle)];
