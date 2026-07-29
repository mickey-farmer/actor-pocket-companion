import { XMLParser } from 'fast-xml-parser';

/**
 * Final Draft (.fdx) files are XML: a flat list of <Paragraph Type="..."> nodes
 * (Scene Heading, Action, Character, Dialogue, Parenthetical, etc.), each
 * containing one or more <Text> runs. We flatten that into plain text,
 * inserting a "## SCENE: <heading>" marker at each scene heading so the
 * scene detector downstream can split on an unambiguous marker instead of
 * guessing from formatting.
 */
export function parseFdx(buffer: Buffer): string {
  const xml = buffer.toString('utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name) => name === 'Paragraph' || name === 'Text',
  });

  const doc = parser.parse(xml);
  if (!doc?.FinalDraft) {
    throw new Error("This doesn't look like a valid Final Draft (.fdx) file.");
  }

  const paragraphs: any[] = doc.FinalDraft?.Content?.Paragraph ?? [];
  const lines: string[] = [];

  for (const p of paragraphs) {
    const type: string = p?.Type ?? 'Action';
    const textNodes: any[] = p?.Text ?? [];
    const text = textNodes
      .map((t) => (typeof t === 'string' ? t : t?.['#text'] ?? ''))
      .join('')
      .trim();

    if (!text) continue;

    switch (type) {
      case 'Scene Heading':
        lines.push(`\n## SCENE: ${text}\n`);
        break;
      case 'Character':
        lines.push(`\n${text.toUpperCase()}`);
        break;
      case 'Parenthetical':
        lines.push(`(${text})`);
        break;
      default:
        lines.push(text);
    }
  }

  return lines.join('\n');
}
