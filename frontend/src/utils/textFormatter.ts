/**
 * textFormatter.ts
 * Clean and normalize Markdown, HTML entities, and citation artifacts
 * across AI responses, document excerpts, and search results.
 */

/**
 * Decodes standard HTML entities commonly found in document extractions,
 * like &#x20;, &nbsp;, &amp;, &lt;, &gt;, &quot;, &#39;.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';

  return text
    // Replace hex whitespace &#x20; and dec whitespace &#32; and &nbsp;
    .replace(/&#x20;/gi, ' ')
    .replace(/&#32;/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    // Common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Strips formatting artifacts and unnecessary escape slashes (e.g. \####, \*, \[, \])
 * while carefully preserving backslashes in legitimate code blocks, file paths (C:\...), and escape sequences.
 */
export function cleanMarkdownFormatting(text: string): string {
  if (!text) return '';

  // 1. Decode entities first
  let cleaned = decodeHtmlEntities(text);

  // 2. Normalize accidental backslash-escaped markdown formatting
  // E.g. \#### Heading -> #### Heading
  cleaned = cleaned.replace(/^\\(#{1,6}\s)/gm, '$1');
  cleaned = cleaned.replace(/\n\\(#{1,6}\s)/g, '\n$1');

  // E.g. \*text\* -> *text* when escaped
  cleaned = cleaned.replace(/\\\*/g, '*');

  // E.g. \_text\_ -> _text_
  cleaned = cleaned.replace(/\\_/g, '_');

  // E.g. \[2\] -> [2]
  cleaned = cleaned.replace(/\\\[/g, '[').replace(/\\\]/g, ']');

  // E.g. **[2]** -> [2] (normalize citation markers so they parse as citations)
  cleaned = cleaned.replace(/\*\*\[(\d+)\]\*\*/g, '[$1]');

  // 3. Ensure headings have a preceding newline if preceded by text without newline
  cleaned = cleaned.replace(/([^\n])\n?(#{1,6}\s+[^\n]+)/g, '$1\n\n$2');

  return cleaned;
}

/**
 * Strips legacy backend-concatenated "### Verified Source Evidence" text
 * from the answer string when the frontend will render a dedicated component for it.
 */
export function stripLegacyVerifiedSection(content: string): string {
  if (!content) return '';
  return content
    .replace(/###\s*Verified Source Evidence[\s\S]*?(?=(###|$))/i, '')
    .trim();
}
