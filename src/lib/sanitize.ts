import sanitize from "sanitize-html";

// Custom HTML section (R26). Editors' HTML is cleaned on save and again on
// render: no scripts, iframes, forms, event handlers or javascript: links.
// "Raw" mode (scripts allowed) can only be saved by the owner or developer
// and runs under the site's CSP.

const CLEAN: sanitize.IOptions = {
  allowedTags: [
    "h2",
    "h3",
    "h4",
    "p",
    "br",
    "hr",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "small",
    "mark",
    "sub",
    "sup",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "img",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "div",
    "span",
    "section",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    "*": ["class", "id"],
  },
  allowedSchemes: ["https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitize.simpleTransform("a", { rel: "noopener noreferrer" }),
    img: sanitize.simpleTransform("img", { loading: "lazy" }),
  },
};

export function sanitizeHtml(html: string): string {
  return sanitize(html, CLEAN);
}
