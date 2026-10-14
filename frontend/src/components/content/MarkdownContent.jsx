import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Styles des éléments Markdown (le HTML brut n'est jamais interprété : contenu partagé entre collaborateurs)
const components = {
  h1: ({ node, ...props }) => (
    <h1 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 mt-4 mb-2 first:mt-0" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 mt-4 mb-2 first:mt-0" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-3 mb-1.5 first:mt-0" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mt-3 mb-1 first:mt-0" {...props} />
  ),
  p: ({ node, ...props }) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
  ul: ({ node, ...props }) => <ul className="my-2 pl-5 list-disc space-y-1 marker:text-amber-600" {...props} />,
  ol: ({ node, ...props }) => (
    <ol className="my-2 pl-5 list-decimal space-y-1 marker:text-amber-600 marker:font-semibold" {...props} />
  ),
  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
  a: ({ node, ...props }) => (
    <a
      className="text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:text-amber-800 dark:hover:text-amber-300"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="my-2 pl-3 border-l-2 border-amber-400 text-stone-600 dark:text-stone-400 italic"
      {...props}
    />
  ),
  code: ({ node, ...props }) => (
    <code className="px-1 py-0.5 rounded-sm bg-stone-200/70 dark:bg-stone-800 font-mono text-[0.85em]" {...props} />
  ),
  pre: ({ node, ...props }) => (
    <pre
      className="my-2 p-3 rounded-lg bg-stone-200/70 dark:bg-stone-800 overflow-x-auto text-xs [&_code]:p-0 [&_code]:bg-transparent"
      {...props}
    />
  ),
  hr: ({ node, ...props }) => <hr className="my-4 border-stone-200 dark:border-stone-700" {...props} />,
  table: ({ node, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th
      className="px-2 py-1.5 text-left font-semibold border-b border-stone-300 dark:border-stone-600"
      {...props}
    />
  ),
  td: ({ node, ...props }) => (
    <td className="px-2 py-1.5 border-b border-stone-200 dark:border-stone-700/70" {...props} />
  ),
  input: ({ node, ...props }) => <input className="mr-1.5 accent-amber-600 align-middle" {...props} />,
  img: ({ node, ...props }) => <img className="my-2 max-w-full rounded-lg" loading="lazy" {...props} />,
};

export default function MarkdownContent({ children = '', className = '' }) {
  return (
    <div className={`wrap-break-word ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
