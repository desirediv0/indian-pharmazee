// Strict allowlist sanitiser for FAQ answers written in the admin panel
// (the editor tells admins "you can use basic HTML tags").
//
// Safe by construction: every piece of text is entity-decoded once and then
// re-escaped, and the only markup that is ever emitted is the allowlisted
// tags below — rebuilt by us, with no attributes except a checked `href` on
// links. Anything else (scripts, event handlers, styles, iframes…) is dropped.
// Tags are also balanced so a stray <b> can never bleed into the page.

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u",
  "ul", "ol", "li", "a", "h2", "h3", "h4", "blockquote",
]);

const VOID_TAGS = new Set(["br"]);

// Elements whose *content* must never be shown either (not just the tag)
const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "object", "embed",
  "noscript", "template", "svg", "math", "head", "title",
]);

// Used only to keep words from running together in the plain-text version
const BLOCK_TAGS = new Set([
  "p", "br", "ul", "ol", "li", "h2", "h3", "h4",
  "blockquote", "div", "tr", "table",
]);

const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  hellip: "…", deg: "°", copy: "©", reg: "®",
};

const MAX_INPUT_LENGTH = 50000;

function decodeEntities(str) {
  return str.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, body) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = isHex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      const isControl = code < 32 && code !== 9 && code !== 10 && code !== 13;
      const isSurrogate = code >= 0xd800 && code <= 0xdfff;
      if (!Number.isFinite(code) || isControl || isSurrogate || code > 0x10ffff) {
        return "";
      }
      return String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named !== undefined ? named : match;
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Returns a checked href from an <a ...> tag, or null if it is not safe.
function safeHref(tag) {
  const match = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(tag);
  if (!match) return null;

  const value = decodeEntities(match[1] ?? match[2] ?? match[3] ?? "").trim();
  if (!value) return null;

  // No whitespace / control characters anywhere (blocks "java\nscript:" tricks)
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code <= 32 || code === 127) return null;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return null;
}

/**
 * @param {string} raw  FAQ answer as stored (plain text or basic HTML)
 * @returns {{ html: string, text: string }}
 *   html — sanitised markup, safe for dangerouslySetInnerHTML
 *   text — plain text version (for FAQ structured data)
 */
export function processFaqAnswer(raw) {
  let src = String(raw ?? "").replace(/<!--[\s\S]*?-->/g, "");
  if (src.length > MAX_INPUT_LENGTH) src = src.slice(0, MAX_INPUT_LENGTH);

  // Plain text answer: turn blank lines into paragraphs, single newlines into <br>
  if (!/<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>/.test(src)) {
    const text = decodeEntities(src).replace(/\r\n?/g, "\n").trim();
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    return {
      html: paragraphs
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
        .join(""),
      text: paragraphs.join(" ").replace(/\s+/g, " "),
    };
  }

  const out = [];
  const textParts = [];
  const stack = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let skipping = null;
  let lastIndex = 0;
  let match;

  const pushText = (chunk) => {
    if (!chunk) return;
    const decoded = decodeEntities(chunk);
    out.push(escapeHtml(decoded));
    textParts.push(decoded);
  };

  while ((match = tagRe.exec(src)) !== null) {
    const before = src.slice(lastIndex, match.index);
    lastIndex = tagRe.lastIndex;

    if (!skipping) pushText(before);

    const closing = match[1] === "/";
    const name = match[2].toLowerCase();
    const selfClosing = /\/\s*>$/.test(match[0]);

    if (skipping) {
      if (closing && name === skipping) skipping = null;
      continue;
    }

    if (DROP_WITH_CONTENT.has(name)) {
      if (!closing && !selfClosing) skipping = name;
      continue;
    }

    if (!ALLOWED_TAGS.has(name)) {
      // Unknown tag (div, span, font…): drop the tag, keep its text
      if (BLOCK_TAGS.has(name)) textParts.push(" ");
      continue;
    }

    if (closing) {
      if (VOID_TAGS.has(name)) continue;
      const index = stack.lastIndexOf(name);
      if (index === -1) continue; // unmatched closing tag
      while (stack.length > index) out.push(`</${stack.pop()}>`);
      if (BLOCK_TAGS.has(name)) textParts.push(" ");
      continue;
    }

    if (name === "br") {
      out.push("<br>");
      textParts.push(" ");
      continue;
    }

    if (name === "a") {
      const href = safeHref(match[0]);
      if (!href) continue; // unsafe link: keep the text, lose the anchor
      out.push(`<a href="${escapeHtml(href)}" rel="noopener noreferrer">`);
      stack.push("a");
      continue;
    }

    out.push(`<${name}>`);
    stack.push(name);
    if (BLOCK_TAGS.has(name)) textParts.push(" ");
  }

  if (!skipping) pushText(src.slice(lastIndex));
  while (stack.length > 0) out.push(`</${stack.pop()}>`);

  return {
    html: out.join(""),
    text: textParts.join("").replace(/\s+/g, " ").trim(),
  };
}
