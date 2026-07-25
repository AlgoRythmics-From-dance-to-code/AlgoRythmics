/* eslint-disable @typescript-eslint/no-explicit-any */
// Simple helper that converts standard Markdown string into a Lexical Editor JSON state structure.
// This allows the AI generator to output markdown, which we convert to Lexical blocks.

export function markdownToLexical(markdown: string) {
  if (!markdown) {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: 'ltr',
      },
    };
  }

  const lines = markdown.split(/\r?\n/);
  const children: any[] = [];

  let currentList: {
    type: 'list';
    listType: 'bullet' | 'number';
    format: string;
    indent: number;
    version: number;
    tag: 'ul' | 'ol';
    children: any[];
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentList) {
        children.push(currentList);
        currentList = null;
      }
      continue;
    }

    // Fenced code block: ```language ... ```
    if (line.startsWith('```')) {
      if (currentList) {
        children.push(currentList);
        currentList = null;
      }
      const lang = line.slice(3).trim() || 'plain';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      // i now points to the closing ``` line (or past end), the for-loop will increment it
      children.push({
        type: 'code',
        language: lang,
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'code-highlight',
            text: codeLines.join('\n'),
            mode: 'normal',
            style: '',
            detail: 0,
            format: 0,
            version: 1,
          },
        ],
      });
      continue;
    }

    // Heading: ## Heading 2
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (currentList) {
        children.push(currentList);
        currentList = null;
      }
      const depth = headingMatch[1].length;
      const tag = `h${Math.min(depth, 3)}`; // h1, h2, h3
      children.push({
        type: 'heading',
        tag,
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: parseTextNode(headingMatch[2]),
      });
      continue;
    }

    // Bullet list item: - Item or * Item
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.listType !== 'bullet') {
        if (currentList) children.push(currentList);
        currentList = {
          type: 'list',
          listType: 'bullet',
          tag: 'ul',
          format: '',
          indent: 0,
          version: 1,
          children: [],
        };
      }
      currentList.children.push({
        type: 'listitem',
        version: 1,
        indent: 0,
        children: parseTextNode(bulletMatch[1]),
      });
      continue;
    }

    // Numbered list item: 1. Item
    const numberMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numberMatch) {
      if (!currentList || currentList.listType !== 'number') {
        if (currentList) children.push(currentList);
        currentList = {
          type: 'list',
          listType: 'number',
          tag: 'ol',
          format: '',
          indent: 0,
          version: 1,
          children: [],
        };
      }
      currentList.children.push({
        type: 'listitem',
        version: 1,
        indent: 0,
        children: parseTextNode(numberMatch[1]),
      });
      continue;
    }

    // Blockquote: > text
    const quoteMatch = line.match(/^>\s+(.*)$/);
    if (quoteMatch) {
      if (currentList) {
        children.push(currentList);
        currentList = null;
      }
      children.push({
        type: 'quote',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: parseTextNode(quoteMatch[1]),
      });
      continue;
    }

    // Regular paragraph line
    if (currentList) {
      children.push(currentList);
      currentList = null;
    }

    children.push({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: parseTextNode(line),
    });
  }

  if (currentList) {
    children.push(currentList);
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  };
}

// Simple text formatter helper that parses inline bold (**), italic (*), and inline code (`)
function parseTextNode(text: string): any[] {
  if (!text.includes('**') && !text.includes('*') && !text.includes('`')) {
    return [
      {
        type: 'text',
        text,
        mode: 'normal',
        style: '',
        detail: 0,
        format: 0,
        version: 1,
      },
    ];
  }

  // Tokenize by **, *, `
  const regex = /(\*\*.*?\*\*|\*.*\*|`.*?`|[^\*`]+)/g;
  const matches = text.match(regex) || [text];

  return matches.map((token) => {
    let cleanText = token;
    let format = 0;

    if (token.startsWith('**') && token.endsWith('**')) {
      cleanText = token.slice(2, -2);
      format = 1; // Bold
    } else if (token.startsWith('*') && token.endsWith('*')) {
      cleanText = token.slice(1, -1);
      format = 2; // Italic
    } else if (token.startsWith('`') && token.endsWith('`')) {
      cleanText = token.slice(1, -1);
      format = 16; // Code
    }

    return {
      type: 'text',
      text: cleanText,
      mode: 'normal',
      style: '',
      detail: 0,
      format,
      version: 1,
    };
  });
}
