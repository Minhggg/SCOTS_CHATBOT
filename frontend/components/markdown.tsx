"use client";

import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
  isQuestion?: boolean;
}

/**
 * Simple Markdown renderer - renders basic markdown formatting
 * For full markdown support, consider installing react-markdown
 */
export function Markdown({ content, className, isQuestion }: MarkdownProps) {
  // Simple markdown rendering - convert basic markdown to HTML
  const renderContent = () => {
    if (!content) return '';
    
    let html = content;
    
    // Escape HTML first to prevent XSS
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Convert code blocks ```language\ncode\n``` to <pre><code> (do this before inline code)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const escapedCode = code
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      return `<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg my-2 overflow-x-auto text-sm"><code>${escapedCode}</code></pre>`;
    });
    
    // Convert inline code `code` to <code>
    html = html.replace(/`([^`\n]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Convert markdown links to HTML
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
    
    // Convert bold **text** to <strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Convert italic *text* to <em> (but not if it's part of **)
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    
    // Convert line breaks (but preserve in code blocks)
    html = html.replace(/\n/g, '<br />');
    
    return html;
  };

  return (
    <div
      className={cn(
        "markdown-body prose prose-sm max-w-none",
        isQuestion ? "text-black" : "text-black",
        className
      )}
      dangerouslySetInnerHTML={{ __html: renderContent() }}
    />
  );
}
