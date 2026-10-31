import React from 'react';
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react';
import ReactMarkdown from 'react-markdown';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextFromLexical(node: any): string {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromLexical).join('\n');
  }
  return '';
}

function cleanMarkdownText(raw: string): string {
  let text = raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  // Convert inline code blocks like "yaml apiVersion: ... | A fenti manifestum" into fenced blocks
  text = text.replace(
    /(?:^|\s*\|\s*)yaml\s+(apiVersion:[\s\S]*?)(?=\s*\|\s*[A-ZÁÉÍÓÖŐÚÜŰ#]|$)/g,
    '\n\n```yaml\n$1\n```\n\n',
  );

  // Convert pipe separators into double newlines for headings, bullets, numbers, code, or sentences
  text = text.replace(/\s*\|\s*(?=[-#*`A-ZÁÉÍÓÖŐÚÜŰa-záéíóöőúüű0-9])/g, '\n\n');
  text = text.replace(/\s*\|\s*/g, '\n\n');

  // Ensure headings start on new lines
  text = text.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');

  // Ensure bullet points start on new lines
  text = text.replace(/([^\n])\s*([-*]\s+)/g, '$1\n$2');

  // Ensure numbered lists start on new lines
  text = text.replace(/([^\n])\s*(\d+\.\s+)/g, '$1\n$2');

  return text.trim();
}

const MarkdownRenderer = ({ markdown }: { markdown: string }) => (
  <div className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-6 mb-3 tracking-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-5 mb-2.5 tracking-tight">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mt-4 mb-2">
            {children}
          </h3>
        ),
        p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !String(children).includes('\n');
          if (isInline) {
            return (
              <code
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-xs sm:text-sm px-1.5 py-0.5 rounded font-bold"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-[#11131c] text-gray-100 p-4 rounded-2xl overflow-x-auto text-xs sm:text-sm my-4 font-mono border border-white/10 shadow-lg">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RichText({ content }: { content: any }) {
  if (!content) return null;

  let data = content;
  if (typeof content === 'string') {
    try {
      data = JSON.parse(content);
    } catch {
      return <MarkdownRenderer markdown={cleanMarkdownText(content)} />;
    }
  }

  if (data && typeof data === 'object' && data.root) {
    const rawLexicalText = extractTextFromLexical(data.root);
    // If the Lexical state is basically an unformatted pipe string (from legacy generator), render clean Markdown
    if (
      rawLexicalText.includes(' | ') ||
      rawLexicalText.includes(' |###') ||
      rawLexicalText.includes(' |- ')
    ) {
      return <MarkdownRenderer markdown={cleanMarkdownText(rawLexicalText)} />;
    }

    return (
      <PayloadRichText
        data={data}
        className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200"
      />
    );
  }

  return <MarkdownRenderer markdown={cleanMarkdownText(String(content || ''))} />;
}
