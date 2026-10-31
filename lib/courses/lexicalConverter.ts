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

  // Normalize escaped newlines and pipe delimiters emitted by LLMs
  let normalized = markdown.replace(/\\n/g, '\n');
  normalized = normalized.replace(/\s*\|\s*(?=[-#*`A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű0-9])/g, '\n\n');
  const lines = normalized.split(/\r?\n/);
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

/**
 * Converts a Lexical JSON editor state (or node) back into standard Markdown string.
 * If input is already a string, it returns the string unchanged.
 */
export function lexicalToMarkdown(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node !== 'object') return String(node);

  // If node has 'root', start from node.root
  if (node.root) {
    return lexicalToMarkdown(node.root);
  }

  const parseInlineChildren = (children: any[]): string => {
    if (!Array.isArray(children)) return '';
    return children
      .map((child) => {
        if (!child) return '';
        if (typeof child === 'string') return child;
        let text = child.text || '';
        const format = child.format || 0;
        // Lexical formats: 1 = bold, 2 = italic, 16 = code
        if (format & 16) text = `\`${text}\``;
        if (format & 1 && format & 2) text = `***${text}***`;
        else if (format & 1) text = `**${text}**`;
        else if (format & 2) text = `*${text}*`;
        return text;
      })
      .join('');
  };

  switch (node.type) {
    case 'root': {
      if (!Array.isArray(node.children)) return '';
      return node.children
        .map(lexicalToMarkdown)
        .filter((chunk: string) => chunk.trim().length > 0)
        .join('\n\n');
    }
    case 'heading': {
      const tag = node.tag || 'h2';
      const level = tag === 'h1' ? '#' : tag === 'h3' ? '###' : '##';
      return `${level} ${parseInlineChildren(node.children)}`;
    }
    case 'paragraph': {
      return parseInlineChildren(node.children);
    }
    case 'quote': {
      return `> ${parseInlineChildren(node.children)}`;
    }
    case 'list': {
      if (!Array.isArray(node.children)) return '';
      const isNumber = node.listType === 'number';
      return node.children
        .map((item: any, idx: number) => {
          const prefix = isNumber ? `${idx + 1}. ` : '- ';
          const content = parseInlineChildren(item.children || item);
          return `${prefix}${content}`;
        })
        .join('\n');
    }
    case 'listitem': {
      return parseInlineChildren(node.children);
    }
    case 'code': {
      const lang = node.language || '';
      let code = '';
      if (Array.isArray(node.children)) {
        code = node.children.map((c: any) => c.text || '').join('\n');
      }
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }
    case 'text': {
      return parseInlineChildren([node]);
    }
    default: {
      if (Array.isArray(node.children)) {
        return node.children.map(lexicalToMarkdown).join('\n');
      }
      return node.text || '';
    }
  }
}
