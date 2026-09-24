import DOMPurify from "dompurify";

const allowedTags = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "hr",
  "div",
  "span",
  "a",
];

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.nodeName === "A" && node.hasAttribute("target")) {
    node.setAttribute("rel", "noopener noreferrer nofollow");
  }
});

export function sanitizeBlogHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}
