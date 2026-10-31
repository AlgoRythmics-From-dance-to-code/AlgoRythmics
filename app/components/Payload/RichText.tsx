import React from 'react';
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react';
import ReactMarkdown from 'react-markdown';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RichText({ content }: { content: any }) {
  if (!content) return null;

  let data = content;
  if (typeof content === 'string') {
    try {
      data = JSON.parse(content);
    } catch {
      // Content is a Markdown string - format pipe-separated lines into clean newlines
      const formattedMarkdown = content.replace(/\s*\|\s*(?=[-#*`A-ZÁÉÍÓÖŐÚÜŰ0-9])/g, '\n\n');
      return (
        <div className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
          <ReactMarkdown>{formattedMarkdown}</ReactMarkdown>
        </div>
      );
    }
  }

  if (data && typeof data === 'object' && data.root) {
    return (
      <PayloadRichText
        data={data}
        className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200"
      />
    );
  }

  const str = String(content || '');
  const formattedStr = str.replace(/\s*\|\s*(?=[-#*`A-ZÁÉÍÓÖŐÚÜŰ0-9])/g, '\n\n');

  return (
    <div className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
      <ReactMarkdown>{formattedStr}</ReactMarkdown>
    </div>
  );
}
