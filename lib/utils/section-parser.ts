export interface MaterialSection {
  index: number;
  heading: string;
  level: number;
  content: string;
  fullText: string; // heading + content
}

/**
 * Parse markdown content into sections based on H2 headings (## ).
 * The first section (before any H2) is treated as the intro/title section.
 */
export function parseSections(markdown: string): MaterialSection[] {
  const lines = markdown.split("\n");
  const sections: MaterialSection[] = [];
  let currentHeading = "";
  let currentLevel = 0;
  let currentLines: string[] = [];
  let sectionIndex = 0;

  const pushSection = () => {
    const content = currentLines.join("\n").trim();
    const headingLine = currentHeading
      ? `${"#".repeat(currentLevel)} ${currentHeading}`
      : "";
    sections.push({
      index: sectionIndex++,
      heading: currentHeading || "Judul & Pendahuluan",
      level: currentLevel,
      content,
      fullText: headingLine ? `${headingLine}\n\n${content}` : content,
    });
  };

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      // Save previous section
      if (currentLines.length > 0 || currentHeading) {
        pushSection();
      }
      currentHeading = h2Match[1].trim();
      currentLevel = 2;
      currentLines = [];
    } else {
      // For the first section (before any H2), check for H1
      if (sectionIndex === 0 && !currentHeading) {
        const h1Match = line.match(/^#\s+(.+)$/);
        if (h1Match) {
          currentHeading = h1Match[1].trim();
          currentLevel = 1;
          continue;
        }
      }
      currentLines.push(line);
    }
  }

  // Push last section
  if (currentLines.length > 0 || currentHeading) {
    pushSection();
  }

  return sections;
}

/**
 * Reconstruct full markdown from sections.
 */
export function reconstructMarkdown(sections: MaterialSection[]): string {
  return sections.map((s) => s.fullText).join("\n\n");
}

/**
 * Replace a specific section's content in the sections array.
 */
export function replaceSection(
  sections: MaterialSection[],
  sectionIndex: number,
  newContent: string
): MaterialSection[] {
  return sections.map((s) => {
    if (s.index !== sectionIndex) return s;

    // Parse the new content to extract heading if present
    const lines = newContent.trim().split("\n");
    const firstLine = lines[0] ?? "";
    const headingMatch = firstLine.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      const heading = headingMatch[2].trim();
      const content = lines.slice(1).join("\n").trim();
      return {
        ...s,
        heading,
        content,
        fullText: newContent.trim(),
      };
    }

    // If no heading in new content, keep old heading
    const headingLine = s.level > 0 ? `${"#".repeat(s.level)} ${s.heading}` : "";
    return {
      ...s,
      content: newContent.trim(),
      fullText: headingLine
        ? `${headingLine}\n\n${newContent.trim()}`
        : newContent.trim(),
    };
  });
}
