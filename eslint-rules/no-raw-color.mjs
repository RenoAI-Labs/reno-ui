/**
 * ESLint rule: no raw colour literals inside registry component source.
 *
 * This is the single mechanism that keeps the token abstraction from leaking.
 * A component that hardcodes `#2563eb` looks fine under the admin preset and
 * silently breaks the ERP one — and the failure is visual, so tests never catch
 * it. Blocking the literal at lint time is the only thing that scales.
 *
 * Theme files are exempt: raw colour values are exactly what they are for.
 */

const COLOR_PATTERNS = [
  // #fff, #ffffff, #ffffffff
  { re: /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{1,5})?\b/, label: "hex colour" },
  // rgb(), hsl(), oklch(), lab(), color-mix(), ...
  {
    re: /\b(?:rgba?|hsla?|hwb|oklch|oklab|lch|lab|color-mix)\s*\(/,
    label: "colour function",
  },
];

/** Colour-carrying Tailwind utility prefixes. */
const UTILITY_PREFIX =
  "bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|shadow|accent|caret|divide|placeholder";

/** Named palette colour with a numeric shade: `bg-blue-500`. */
const PALETTE_UTILITY = new RegExp(
  `(?:^|[\\s:[])(?:${UTILITY_PREFIX})-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b`,
);

/**
 * Bare colour keywords: `bg-black`, `text-white/70`, `border-black`.
 *
 * These have no numeric shade, so the palette pattern above misses them
 * entirely — which is how four overlay components shipped a hardcoded
 * `bg-black/50` past this rule. `transparent`, `current` and `inherit` are
 * allowed: they carry no colour of their own.
 */
const KEYWORD_UTILITY = new RegExp(
  `(?:^|[\\s:[])(?:${UTILITY_PREFIX})-(?:black|white)(?:\\/\\d+)?\\b`,
);

/**
 * CSS colour keywords. Kept to the ones that plausibly appear as a real value;
 * a longer list buys nothing and raises the chance of flagging ordinary prose.
 */
const COLOR_KEYWORD =
  "black|white|red|blue|green|yellow|orange|purple|pink|gray|grey|brown|cyan|magenta|navy|teal|olive|maroon|silver";

/**
 * A colour keyword inside an arbitrary value: `bg-[red]`.
 *
 * Deliberately narrow. Matching every `prefix-[...]` would flag `ring-[3px]`,
 * `shadow-[0_0_0_1px_var(--sidebar-border)]` and `text-[10px]` — lengths and
 * shadows, not colours. Hex and colour-function forms inside brackets are
 * already caught by COLOR_PATTERNS scanning the whole string, so this only has
 * to cover the bare-keyword case.
 */
const ARBITRARY_COLOR = new RegExp(
  `(?:^|[\\s:])(?:${UTILITY_PREFIX})-\\[(?:${COLOR_KEYWORD})\\]`,
  "i",
);

/**
 * A bare colour keyword as an entire string value — an inline
 * `style={{ color: "red" }}`. Applied only to string literals, never to JSX
 * text, so ordinary copy containing the word "green" is not a lint error.
 */
const CSS_KEYWORD = new RegExp(`^(?:${COLOR_KEYWORD})$`, "i");

function findViolation(text, { allowKeyword = false } = {}) {
  for (const { re, label } of COLOR_PATTERNS) {
    if (re.test(text)) return label;
  }
  if (PALETTE_UTILITY.test(text)) return "Tailwind palette colour";
  if (KEYWORD_UTILITY.test(text)) return "Tailwind black/white utility";
  if (ARBITRARY_COLOR.test(text)) return "arbitrary colour value";
  if (!allowKeyword && CSS_KEYWORD.test(text.trim())) return "CSS colour keyword";
  return null;
}

/** @type {import("eslint").Rule.RuleModule} */
const noRawColor = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw colour values in registry components; use semantic design tokens instead.",
    },
    schema: [],
    messages: {
      rawColor:
        "Raw {{kind}} found. Registry components must read semantic tokens (bg-primary, text-muted-foreground, var(--border)) so theme presets can re-colour them. See docs/design-tokens.md.",
    },
  },
  create(context) {
    function check(node, text, options) {
      if (typeof text !== "string" || text.length === 0) return;
      const kind = findViolation(text, options);
      if (kind) context.report({ node, messageId: "rawColor", data: { kind } });
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
      JSXText(node) {
        // Catches colour syntax in raw JSX text, e.g. an inline <style>. A bare
        // keyword is allowed here — it is almost always a word in a sentence.
        check(node, node.value, { allowKeyword: true });
      },
    };
  },
};

const plugin = {
  rules: { "no-raw-color": noRawColor },
};

export default plugin;
