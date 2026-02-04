"use client";

import React from "react";

interface SimpleMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Simple markdown renderer for chat messages.
 * Handles: **bold**, *italic*, `code`, and links.
 * No external dependencies needed.
 */
export default function SimpleMarkdown({ content, className = "" }: SimpleMarkdownProps) {
  // Process markdown inline elements
  const renderMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    
    // Regex to match markdown patterns
    // Order matters: bold (**) before italic (*) to avoid conflicts
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, render: (match: string) => <strong key={key++} className="font-semibold">{match}</strong> },
      { regex: /\*(.+?)\*/g, render: (match: string) => <em key={key++}>{match}</em> },
      { regex: /`(.+?)`/g, render: (match: string) => <code key={key++} className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">{match}</code> },
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, render: (text: string, url: string) => <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-accent underline hover:no-underline">{text}</a> },
    ];
    
    let remaining = text;
    let result: React.ReactNode[] = [];
    
    // Split by newlines first to preserve line breaks
    const lines = remaining.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        result.push(<br key={`br-${key++}`} />);
      }
      
      // Process each pattern
      let segments: (string | React.ReactNode)[] = [line];
      
      // Bold
      segments = segments.flatMap(segment => {
        if (typeof segment !== 'string') return segment;
        const boldRegex = /\*\*(.+?)\*\*/g;
        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(segment)) !== null) {
          if (match.index > lastIndex) {
            parts.push(segment.slice(lastIndex, match.index));
          }
          parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < segment.length) {
          parts.push(segment.slice(lastIndex));
        }
        return parts.length > 0 ? parts : [segment];
      });
      
      // Italic (single asterisk, but not inside bold)
      segments = segments.flatMap(segment => {
        if (typeof segment !== 'string') return segment;
        const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = italicRegex.exec(segment)) !== null) {
          if (match.index > lastIndex) {
            parts.push(segment.slice(lastIndex, match.index));
          }
          parts.push(<em key={key++}>{match[1]}</em>);
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < segment.length) {
          parts.push(segment.slice(lastIndex));
        }
        return parts.length > 0 ? parts : [segment];
      });
      
      // Inline code
      segments = segments.flatMap(segment => {
        if (typeof segment !== 'string') return segment;
        const codeRegex = /`([^`]+)`/g;
        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = codeRegex.exec(segment)) !== null) {
          if (match.index > lastIndex) {
            parts.push(segment.slice(lastIndex, match.index));
          }
          parts.push(
            <code key={key++} className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">
              {match[1]}
            </code>
          );
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < segment.length) {
          parts.push(segment.slice(lastIndex));
        }
        return parts.length > 0 ? parts : [segment];
      });
      
      // Links [text](url)
      segments = segments.flatMap(segment => {
        if (typeof segment !== 'string') return segment;
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = linkRegex.exec(segment)) !== null) {
          if (match.index > lastIndex) {
            parts.push(segment.slice(lastIndex, match.index));
          }
          parts.push(
            <a 
              key={key++} 
              href={match[2]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-accent underline hover:no-underline"
            >
              {match[1]}
            </a>
          );
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < segment.length) {
          parts.push(segment.slice(lastIndex));
        }
        return parts.length > 0 ? parts : [segment];
      });
      
      result.push(...segments);
    });
    
    return result;
  };

  return (
    <span className={`${className} leading-relaxed`}>
      {renderMarkdown(content)}
    </span>
  );
}
