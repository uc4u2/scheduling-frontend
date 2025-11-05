// src/components/website/EnterpriseRichTextEditor.js
import React, { useEffect } from "react";
import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";

import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style"; // <-- named import (correct)

export default function EnterpriseRichTextEditor({
  value = "",
  onChange,
  placeholder = "Type here…",
  align = "left",
  alignEnabled = true,
  onReady,
  onKeyDown,
}) {
  const editor = useEditor({
    extensions: [
      // text formatting + lists + headings
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),

      // underline mark
      Underline,

      // text alignment for headings & paragraphs
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: align,
      }),

      // link mark
      Link.configure({
        openOnClick: true,
        autolink: true,
        protocols: ["http", "https", "mailto", "tel"],
        HTMLAttributes: { rel: "noopener nofollow ugc" },
      }),

      // placeholder
      Placeholder.configure({
        placeholder,
        includeChildren: true,
      }),

      // text-style mark (enables future color/size if you add those extensions)
      TextStyle,
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        style: "min-height:120px; padding:12px; outline:none;",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) onChange(html);
    },
  });

  // keep external align prop in sync
  useEffect(() => {
    if (!editor) return;
    editor.commands.setTextAlign(align || "left");
  }, [align, editor]);

  // keep external value in sync (avoid loops)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "<p></p>", false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor || !onReady) return undefined;
    onReady(editor);
    return () => onReady(null);
  }, [editor, onReady]);

  if (!editor) return null;

  const applyLink = () => {
    const prev = editor.getAttributes("link")?.href || "";
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return; // cancel
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const unsetLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <Box
      sx={{
        border: (t) => `1px solid ${t.palette.divider}`,
        borderRadius: 1.5,
      }}
    >
      {/* Toolbar */}
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{ p: 0.5, flexWrap: "wrap" }}
      >
        {/* Marks */}
        <Tooltip title="Bold">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            color={editor.isActive("bold") ? "primary" : "default"}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Italic">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            color={editor.isActive("italic") ? "primary" : "default"}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Underline">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            color={editor.isActive("underline") ? "primary" : "default"}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Strikethrough">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            color={editor.isActive("strike") ? "primary" : "default"}
          >
            <StrikethroughSIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

        {/* Lists */}
        <Tooltip title="Bullet list">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            color={editor.isActive("bulletList") ? "primary" : "default"}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Numbered list">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            color={editor.isActive("orderedList") ? "primary" : "default"}
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

        {/* Alignment */}
        {alignEnabled && (
          <>
            <Tooltip title="Align left">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                color={editor.isActive({ textAlign: "left" }) ? "primary" : "default"}
              >
                <FormatAlignLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Align center">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                color={editor.isActive({ textAlign: "center" }) ? "primary" : "default"}
              >
                <FormatAlignCenterIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Align right">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                color={editor.isActive({ textAlign: "right" }) ? "primary" : "default"}
              >
                <FormatAlignRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Justify">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                color={editor.isActive({ textAlign: "justify" }) ? "primary" : "default"}
              >
                <FormatAlignJustifyIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />
          </>
        )}

        {/* Links */}
        <Tooltip title="Add/Update link">
          <IconButton size="small" onClick={applyLink}>
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove link">
          <IconButton size="small" onClick={unsetLink}>
            <LinkOffIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

        {/* History */}
        <Tooltip title="Undo">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo">
          <span>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* Editor area */}
      <Box
        sx={{
          borderTop: (t) => `1px solid ${t.palette.divider}`,
          "& .ProseMirror": {
            outline: "none",
            minHeight: "120px",
            padding: "12px",
            fontSize: ".95rem",
            lineHeight: 1.7,
          },
          // Placeholder style (works with @tiptap/extension-placeholder)
          "& .ProseMirror p.is-editor-empty:first-of-type::before": {
            content: `"${placeholder}"`,
            float: "left",
            color: "text.disabled",
            pointerEvents: "none",
            height: 0,
            opacity: 0.8,
          },
        }}
      >
        <EditorContent editor={editor} onKeyDown={onKeyDown} />
      </Box>
    </Box>
  );
}
