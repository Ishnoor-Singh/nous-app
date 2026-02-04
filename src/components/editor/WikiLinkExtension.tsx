"use client";

import { Mark, mergeAttributes, markInputRule, markPasteRule } from "@tiptap/core";

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>;
  onLinkClick?: (noteTitle: string) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    wikiLink: {
      /**
       * Set a wiki link mark
       */
      setWikiLink: (attributes: { noteTitle: string }) => ReturnType;
      /**
       * Toggle a wiki link mark
       */
      toggleWikiLink: (attributes: { noteTitle: string }) => ReturnType;
      /**
       * Unset a wiki link mark
       */
      unsetWikiLink: () => ReturnType;
    };
  }
}

// Regex to match [[note title]]
const wikiLinkInputRegex = /\[\[([^\]]+)\]\]$/;
const wikiLinkPasteRegex = /\[\[([^\]]+)\]\]/g;

export const WikiLink = Mark.create<WikiLinkOptions>({
  name: "wikiLink",

  addOptions() {
    return {
      HTMLAttributes: {},
      onLinkClick: undefined,
    };
  },

  addAttributes() {
    return {
      noteTitle: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-note-title"),
        renderHTML: (attributes) => {
          if (!attributes.noteTitle) {
            return {};
          }
          return {
            "data-note-title": attributes.noteTitle,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wiki-link="true"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-wiki-link": "true",
        class: "wiki-link cursor-pointer text-accent hover:underline",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setWikiLink:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleWikiLink:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetWikiLink:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: wikiLinkInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          noteTitle: match[1],
        }),
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: wikiLinkPasteRegex,
        type: this.type,
        getAttributes: (match) => ({
          noteTitle: match[1],
        }),
      }),
    ];
  },
});

// Helper to extract all wiki links from content
export function extractWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }
  
  return [...new Set(links)]; // Remove duplicates
}
