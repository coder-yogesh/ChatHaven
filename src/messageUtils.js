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

// Friendly display names for common fence language tags, so the code block
// header reads "JavaScript" instead of a raw "js"/"javascript" tag.
const LANGUAGE_LABELS = {
  js: "JavaScript",
  jsx: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  tsx: "TypeScript",
  typescript: "TypeScript",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  ruby: "Ruby",
  java: "Java",
  go: "Go",
  golang: "Go",
  rs: "Rust",
  rust: "Rust",
  c: "C",
  cpp: "C++",
  "c++": "C++",
  cs: "C#",
  csharp: "C#",
  php: "PHP",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  sql: "SQL",
  sh: "Shell",
  bash: "Shell",
  shell: "Shell",
  txt: "Text",
  text: "Text",
};

/** Turns a fence language tag (e.g. "js") into a friendly label ("JavaScript"). */
export function formatLanguageLabel(language) {
  if (!language) return "Text";
  const key = language.toLowerCase();
  if (LANGUAGE_LABELS[key]) return LANGUAGE_LABELS[key];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Copy plain text to the clipboard. Returns a promise. */
export function copyToClipboard(value) {
  return navigator.clipboard.writeText(value);
}

/**
 * Scans markdown for a filename mentioned just before a code fence — e.g.
 *   ## 2️⃣ `package.json`
 *   ```json
 *   { ... }
 *   ```
 * and rewrites the fence's info string from ```json to ```json:package.json
 * so each code block can be labeled with its actual filename instead of
 * just a generic language tag. Matches a backtick token that looks like a
 * filename (has a dot + extension) anywhere in the ~2 lines before a fence.
 *
 * @param {string} markdown
 * @returns {string} markdown with fence info strings annotated
 */
export function annotateCodeBlockFilenames(markdown = "") {
  const lines = markdown.split("\n");
  const filenameRegex = /`([\w./-]+\.\w{1,10})`/; // `something.ext`
  const fenceOpenRegex = /^(\s*```)(\w*)\s*$/;

  let lastFilename = null;

  for (let i = 0; i < lines.length; i++) {
    const fenceMatch = lines[i].match(fenceOpenRegex);

    if (fenceMatch) {
      if (lastFilename) {
        const [, backticks, lang] = fenceMatch;
        lines[i] = `${backticks}${lang || "text"}:${lastFilename}`;
        lastFilename = null; // only tag the very next fence after a match
      }
      continue;
    }

    const nameMatch = lines[i].match(filenameRegex);
    if (nameMatch && !lines[i].trim().startsWith("```")) {
      lastFilename = nameMatch[1];
    }
  }

  return lines.join("\n");
}

/**
 * Extracts every fenced code block from a message as a { filename, lang,
 * code } record, using the same filename-detection as
 * annotateCodeBlockFilenames(). Blocks with no detected filename get a
 * generic fallback name based on their position and language.
 *
 * @param {string} markdown - raw (un-annotated) markdown message
 * @returns {{ filename: string, lang: string, code: string }[]}
 */
export function extractCodeFiles(markdown = "") {
  const annotated = annotateCodeBlockFilenames(markdown);
  const fenceRegex = /```(\w*)(?::([^\n]+))?\n([\s\S]*?)```/g;
  const files = [];
  let match;
  let index = 0;

  while ((match = fenceRegex.exec(annotated)) !== null) {
    const [, lang, filename, code] = match;
    index += 1;
    files.push({
      filename: filename || `snippet-${index}.${lang || "txt"}`,
      lang: lang || "text",
      code: code.trim(),
    });
  }

  return files;
}

/**
 * Joins extracted code files into one pasteable block, each preceded by a
 * "// filename" comment header, in their original order.
 * @param {{ filename: string, code: string }[]} files
 */
export function formatCodebase(files) {
  return files.map((f) => `// ${f.filename}\n${f.code}`).join("\n\n");
}