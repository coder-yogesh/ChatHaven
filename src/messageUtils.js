// messageUtils.js
// Splits a markdown AI response into its prose text and its fenced code
// blocks, so they can be copied separately.

/**
 * @param {string} markdown - raw markdown message (e.g. from the AI)
 * @returns {{ text: string, codeBlocks: { lang: string, code: string }[] }}
 */
export function splitContent(markdown = "") {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const codeBlocks = [];
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push({
      lang: match[1] || "text",
      code: match[2].trim(),
    });
  }

  // Remove the fenced code blocks, then strip common markdown symbols
  // so "copy text" gives clean prose rather than raw markdown syntax.
  const text = markdown
    .replace(codeBlockRegex, "")
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1") // italics
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^\s*[-*]\s+/gm, "• ") // bullet lists
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, codeBlocks };
}

/** Copy plain text to the clipboard. Returns a promise. */
export function copyToClipboard(value) {
  return navigator.clipboard.writeText(value);
}