// src/components/website/RichText.js
import React, { useEffect } from "react";
import { Box } from "@mui/material";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { sanitizeHtml } from "../../utils/sanitizeHtml";

/**
 * TipTap wrapper with end-to-end HTML sanitization.
 * Emits sanitized HTML via onChange(value).
 */
export default function RichText({ value = "", onChange, height = 160 }) {
  const initial = sanitizeHtml(String(value));

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: initial,
    editorProps: {
      attributes: { style: `outline:none;padding:8px;min-height:${height}px;` },
      handlePaste(view, event) {
        // Sanitize pasted HTML
        const html = event.clipboardData?.getData("text/html");
        if (html) {
          event.preventDefault();
          const clean = sanitizeHtml(html);
          view.dispatch(view.state.tr.insertText("")); // noop to ensure transaction
          view.dom.ownerDocument.execCommand("insertHTML", false, clean);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const clean = sanitizeHtml(html);
      if (clean !== html) {
        // If sanitization changed something, reflect it back into the editor
        editor.commands.setContent(clean, false);
      }
      onChange?.(clean);
    },
  });

  // Keep editor in sync if the parent `value` prop changes externally
  useEffect(() => {
    if (!editor) return;
    const clean = sanitizeHtml(String(value));
    const current = editor.getHTML();
    if (clean !== current) {
      editor.commands.setContent(clean, false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <Box sx={{ height, border: "1px solid #e0e0e0", borderRadius: 1 }} />
    );
  }

  return (
    <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
      <EditorContent editor={editor} />
    </Box>
  );
}
