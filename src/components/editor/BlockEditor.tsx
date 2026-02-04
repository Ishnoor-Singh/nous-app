"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Minus,
  Link as LinkIcon,
  Highlighter,
} from "lucide-react";
import SlashMenu from "./SlashMenu";

const lowlight = createLowlight(common);

interface BlockEditorProps {
  content?: any;
  placeholder?: string;
  onChange?: (json: any, text: string) => void;
  onSave?: () => void;
  editable?: boolean;
  className?: string;
}

export default function BlockEditor({
  content,
  placeholder = "Start writing, or press '/' for commands...",
  onChange,
  onSave,
  editable = true,
  className = "",
}: BlockEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-accent underline cursor-pointer",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: content || "",
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      onChange?.(json, text);
    },
    editorProps: {
      attributes: {
        class: `prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[200px] ${className}`,
      },
      handleKeyDown: (view, event) => {
        // Handle slash command
        if (event.key === "/" && !showSlashMenu) {
          const { state } = view;
          const { from } = state.selection;
          const coords = view.coordsAtPos(from);
          
          setSlashMenuPosition({
            top: coords.bottom + 8,
            left: coords.left,
          });
          setShowSlashMenu(true);
          return false;
        }
        
        // Close slash menu on escape
        if (event.key === "Escape" && showSlashMenu) {
          setShowSlashMenu(false);
          return true;
        }
        
        // Save shortcut
        if ((event.metaKey || event.ctrlKey) && event.key === "s") {
          event.preventDefault();
          onSave?.();
          return true;
        }
        
        return false;
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== undefined && editor.getJSON() !== content) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  // Close slash menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setShowSlashMenu(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleSlashCommand = useCallback(
    (command: string) => {
      if (!editor) return;
      
      // Delete the slash character
      editor.commands.deleteRange({
        from: editor.state.selection.from - 1,
        to: editor.state.selection.from,
      });

      switch (command) {
        case "h1":
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case "h2":
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case "h3":
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case "bullet":
          editor.chain().focus().toggleBulletList().run();
          break;
        case "numbered":
          editor.chain().focus().toggleOrderedList().run();
          break;
        case "todo":
          editor.chain().focus().toggleTaskList().run();
          break;
        case "quote":
          editor.chain().focus().toggleBlockquote().run();
          break;
        case "code":
          editor.chain().focus().toggleCodeBlock().run();
          break;
        case "divider":
          editor.chain().focus().setHorizontalRule().run();
          break;
      }
      
      setShowSlashMenu(false);
    },
    [editor]
  );

  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Bubble Menu - Formatting toolbar */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-1 p-1 rounded-lg glass-card border border-white/10 shadow-xl"
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            icon={<Bold className="w-4 h-4" />}
            title="Bold"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            icon={<Italic className="w-4 h-4" />}
            title="Italic"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            icon={<Strikethrough className="w-4 h-4" />}
            title="Strikethrough"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            icon={<Code className="w-4 h-4" />}
            title="Code"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive("highlight")}
            icon={<Highlighter className="w-4 h-4" />}
            title="Highlight"
          />
          <div className="w-px h-4 bg-white/20 mx-1" />
          <ToolbarButton
            onClick={() => {
              const url = window.prompt("Enter URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            active={editor.isActive("link")}
            icon={<LinkIcon className="w-4 h-4" />}
            title="Link"
          />
        </BubbleMenu>
      )}

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <SlashMenu
          position={slashMenuPosition}
          onSelect={handleSlashCommand}
          onClose={() => setShowSlashMenu(false)}
        />
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        
        .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255, 255, 255, 0.3);
          pointer-events: none;
          height: 0;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
        }

        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
        }

        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.5rem;
        }

        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.5rem;
        }

        .ProseMirror p {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.5rem;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror li {
          color: rgba(255, 255, 255, 0.9);
        }

        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .ProseMirror ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 0.25rem;
        }

        .ProseMirror ul[data-type="taskList"] li > label input {
          appearance: none;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 0.25rem;
          background: transparent;
          cursor: pointer;
        }

        .ProseMirror ul[data-type="taskList"] li > label input:checked {
          background: var(--accent, #6366f1);
          border-color: var(--accent, #6366f1);
        }

        .ProseMirror ul[data-type="taskList"] li > label input:checked::after {
          content: '✓';
          display: block;
          color: white;
          font-size: 0.75rem;
          text-align: center;
          line-height: 0.75rem;
        }

        .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div > p {
          text-decoration: line-through;
          opacity: 0.6;
        }

        .ProseMirror blockquote {
          border-left: 3px solid var(--accent, #6366f1);
          padding-left: 1rem;
          margin-left: 0;
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }

        .ProseMirror pre {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
          margin-bottom: 0.5rem;
        }

        .ProseMirror pre code {
          font-family: "JetBrains Mono", "Fira Code", monospace;
          font-size: 0.875rem;
          color: #e2e8f0;
        }

        .ProseMirror code {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: "JetBrains Mono", "Fira Code", monospace;
          font-size: 0.875em;
          color: #f472b6;
        }

        .ProseMirror hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          margin: 1.5rem 0;
        }

        .ProseMirror mark {
          background: rgba(250, 204, 21, 0.4);
          color: white;
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
        }

        .ProseMirror a {
          color: var(--accent, #6366f1);
          text-decoration: underline;
        }

        /* Syntax highlighting */
        .hljs-keyword { color: #c678dd; }
        .hljs-string { color: #98c379; }
        .hljs-number { color: #d19a66; }
        .hljs-function { color: #61afef; }
        .hljs-comment { color: #5c6370; font-style: italic; }
        .hljs-variable { color: #e06c75; }
        .hljs-attr { color: #d19a66; }
      `}</style>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  icon,
  title,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md transition-all ${
        active
          ? "bg-accent/30 text-accent"
          : "text-white/60 hover:text-white hover:bg-white/10"
      }`}
      title={title}
    >
      {icon}
    </button>
  );
}
