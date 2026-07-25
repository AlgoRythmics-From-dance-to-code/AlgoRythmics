import React from 'react';
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RichText({ content }: { content: any }) {
  if (!content) return null;

  let data = content;
  if (typeof content === 'string') {
    try {
      data = JSON.parse(content);
    } catch {
      return (
        <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          <p>{content}</p>
        </div>
      );
    }
  }

  if (data && typeof data === 'object' && data.root) {
    return (
      <PayloadRichText
        data={data}
        className="prose dark:prose-invert max-w-none text-lg leading-relaxed text-gray-700 dark:text-gray-300"
      />
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed text-gray-700 dark:text-gray-300">
      <p>{String(content)}</p>
    </div>
  );
}
