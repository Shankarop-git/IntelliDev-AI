'use client'

/**
 * MarkdownRenderer – renders AI responses with:
 * - Full GFM Markdown (tables, task lists, etc.)
 * - Fenced code blocks with syntax highlighting (Prism)
 * - One-click copy button on every code block
 */

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  language: string
  children: string
}

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-slate-700">
      {/* Language Badge + Copy Button */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.875rem',
          lineHeight: '1.6',
          padding: '1.25rem',
        }}
        showLineNumbers
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-slate max-w-none text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isBlock = match !== null

            if (isBlock) {
              return (
                <CodeBlock language={match[1]}>
                  {String(children).replace(/\n$/, '')}
                </CodeBlock>
              )
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[0.8em]"
                {...props}
              >
                {children}
              </code>
            )
          },
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-slate-700 leading-7">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-slate-900 mt-6 mb-3">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-slate-900 mt-5 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-slate-800 mt-4 mb-2">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-slate-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-700">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-6">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-200 px-3 py-2 text-slate-600">{children}</td>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
