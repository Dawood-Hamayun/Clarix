export interface ChunkResult {
  content: string;
  heading?: string;
  position: number;
}

export function chunkText(
  text: string,
  maxChunkSize: number = 1500,
  overlap: number = 200
): ChunkResult[] {
  const chunks: ChunkResult[] = [];

  // Clean the text
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (cleaned.length <= maxChunkSize) {
    return [{ content: cleaned, position: 0 }];
  }

  // Try to split on paragraph boundaries first
  const paragraphs = cleaned.split(/\n\n+/);
  let currentChunk = "";
  let currentHeading: string | undefined;
  let position = 0;

  for (const paragraph of paragraphs) {
    // Detect headings (lines starting with # or all-caps short lines)
    const isHeading =
      paragraph.startsWith("#") ||
      (paragraph.length < 100 &&
        paragraph === paragraph.toUpperCase() &&
        paragraph.length > 3);

    if (isHeading) {
      currentHeading = paragraph.replace(/^#+\s*/, "");
    }

    if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          heading: currentHeading,
          position: position++,
        });
      }
      // Start new chunk with overlap from the end of previous
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + "\n\n" + paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      heading: currentHeading,
      position: position,
    });
  }

  return chunks;
}
