export async function parseContent(
  content: string,
  type: "text" | "url" | "file",
  fileType?: string
): Promise<string> {
  if (type === "text") {
    return content;
  }

  if (type === "url") {
    return await scrapeUrl(content);
  }

  if (type === "file") {
    // For MVP, handle text-based file content directly
    // The file content is already extracted on the client side
    return content;
  }

  return content;
}

/**
 * Decode common HTML named entities + ALL numeric entities
 * (both decimal `&#39;` and hex `&#x27;` forms). The previous
 * version only handled a hand-rolled list, so apostrophes and
 * other punctuation leaked through as `&#x27;` into the index.
 */
function decodeHtmlEntities(input: string): string {
  const NAMED: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    hellip: "…",
    mdash: "—",
    ndash: "–",
    lsquo: "\u2018",
    rsquo: "\u2019",
    ldquo: "\u201C",
    rdquo: "\u201D",
    copy: "©",
    reg: "®",
    trade: "™",
  };

  return input
    // Hex numeric: &#x27; &#xA0; etc.
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    // Decimal numeric: &#39; &#160; etc.
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    // Named: &amp; &nbsp; etc.
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED[name] ?? match);
}

async function scrapeUrl(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        // A realistic UA helps with sites that 403 default fetch clients
        "User-Agent":
          "Mozilla/5.0 (compatible; Clarix-Bot/1.0; +https://clarix.ai/bot) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
  } catch (error) {
    throw new Error(
      `Failed to fetch URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
  }

  const html = await response.text();

  // Try to pull the <title> separately so it becomes a leading heading
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(stripTags(titleMatch[1])).trim() : "";

  // Prefer the <main> or <article> region if present — gives much cleaner
  // output on sites where the real content lives there.
  let body = html;
  const mainMatch =
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (mainMatch) body = mainMatch[1];

  let text = body
    // Drop anything the model definitely shouldn't see
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    // Convert headers, paragraphs, lists to clean breaks
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, "\n\n## $2\n\n")
    .replace(/<\/(p|div|section|li|tr|br)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<br\s*\/?>/gi, "\n");

  text = stripTags(text);
  text = decodeHtmlEntities(text);

  // Normalise whitespace
  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  // Drop lines that are pure punctuation / dividers left over from the DOM
  text = text
    .split("\n")
    .filter((line) => {
      const l = line.trim();
      if (!l) return true; // keep blank separators
      if (/^[-_=*•·]+$/.test(l)) return false; // divider rows
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (title && !text.toLowerCase().startsWith(title.toLowerCase())) {
    text = `# ${title}\n\n${text}`;
  }

  if (!text) {
    throw new Error(
      "No readable text content could be extracted from this URL. If it's a single-page app, try pasting the content directly instead."
    );
  }

  return text;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ");
}
