/**
 * Decides an npm `license` string against a set of allowed identifiers.
 *
 * Most packages carry a bare identifier ("MIT"), but the field is specified as
 * an SPDX *expression* and the compound forms appear in a real tree:
 * `victory-vendor`, which arrives underneath `recharts`, is "MIT AND ISC".
 * A gate that compares the raw string against a Set rejects that package even
 * though both halves are permissive — a false failure on a correct dependency,
 * which is the fastest way to teach people to work around a gate.
 *
 * Grammar handled, per the SPDX spec: identifiers, `AND`, `OR`, parentheses and
 * `WITH` exceptions, with `AND` binding tighter than `OR`.
 *
 * The semantics are what the operators actually mean. `AND` is a conjunction —
 * every listed license applies at once, so all of them must be acceptable. `OR`
 * is a choice offered to the consumer, so one acceptable branch is enough.
 * `X WITH Y` is decided on `X` alone: an exception only ever widens a license,
 * so it cannot rescue one we rejected, and reading it is a judgement call rather
 * than a lookup.
 *
 * Anything that does not parse — "SEE LICENSE IN LICENSE.txt", "UNLICENSED", a
 * trailing `+` — is not allowed. That is the conservative direction: it stops
 * the build and asks for a person, rather than passing something unread.
 */

/** Identifiers, operators and parentheses. Whitespace separates, parens do not need it. */
function tokenize(expression) {
  return expression.match(/\(|\)|[^\s()]+/g) ?? [];
}

const OPERATORS = new Set(["AND", "OR", "WITH"]);

export function isAllowedLicense(expression, allowed) {
  if (typeof expression !== "string") return false;

  const tokens = tokenize(expression);
  let at = 0;
  const peek = () => tokens[at];

  /** A parenthesised group, or one identifier with its optional `WITH` exception. */
  function parseAtom() {
    if (peek() === "(") {
      at += 1;
      const value = parseOr();
      if (value === null || peek() !== ")") return null;
      at += 1;
      return value;
    }

    const identifier = peek();
    if (!identifier || identifier === ")" || OPERATORS.has(identifier)) return null;
    at += 1;

    if (peek() === "WITH") {
      at += 1;
      const exception = peek();
      if (!exception || exception === ")" || OPERATORS.has(exception)) return null;
      at += 1;
    }

    return allowed.has(identifier);
  }

  function parseAnd() {
    let value = parseAtom();
    while (value !== null && peek() === "AND") {
      at += 1;
      const right = parseAtom();
      if (right === null) return null;
      value = value && right;
    }
    return value;
  }

  function parseOr() {
    let value = parseAnd();
    while (value !== null && peek() === "OR") {
      at += 1;
      const right = parseAnd();
      if (right === null) return null;
      value = value || right;
    }
    return value;
  }

  // Trailing tokens mean the expression was only partly understood, which is
  // indistinguishable from not understanding it at all.
  return parseOr() === true && at === tokens.length;
}
