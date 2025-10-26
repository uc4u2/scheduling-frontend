// src/components/website/EnterpriseRichTextEditor.js
import * as React from "react";
import { useEffect, useMemo } from "react";
import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  TextField,
  Button,
  useTheme,
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
import ImageIcon from "@mui/icons-material/Image";
import TitleIcon from "@mui/icons-material/Title";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import Looks3Icon from "@mui/icons-material/Looks3";

// TipTap
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";

/**
 * EnterpriseRichTextEditor
 * Props:
 *  - value: string (HTML)
 *  - onChange: (html: string) => void
 *  - placeholder?: string
 *  - align?: 'left'|'center'|'right'|'justify'
 */
export default function EnterpriseRichTextEditor({
  value = "",
  onChange,
  placeholder = "Type here…",
  align = "left",
}) {
  const theme = useTheme();

  const editor = useEditor({
    extensions: [
      Color.configure({ types: ["textStyle"] }),
      TextStyle,
      Underline,
      Link.configure({
        protocols: ["http", "https", "mailto", "tel"],
        openOnClick: true,
        autolink: true,
        HTMLAttributes: { rel: "noopener nofollow ugc" },
      }),
      Image.configure({
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: align,
      }),
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        heading: { levels: [1, 2, 3] },
        blockquote: true,
        codeBlock: false,
      }),
    ],
    content: value || "",
    autofocus: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (typeof onChange === "function") onChange(html);
    },
    editorProps: {
      attributes: {
        "data-placeholder": placeholder,
        style: `
          outline: none;
          min-height: 140px;
        `,
      },
    },
  });

  // Keep controlled from props (avoid loops by comparing html)
  useEffect(() => {
    if (!editor) return;
    const cur = editor.getHTML();
    if ((value || "") !== cur) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  // Small helpers
  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link")?.href || "";
    const url = window.prompt("Enter URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  const setImage = () => {
    if (!editor) return;
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url, alt: "" }).run();
  };

  const ToolbarButton = ({ title, icon, active, onClick, disabled }) => (
    <Tooltip title={title}>
      <span>
        <IconButton size="small" onClick={onClick} disabled={disabled} color={active ? "primary" : "default"}>
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  // (optional helper if you want to reflect current text-align somewhere)
  const alignIcon = useMemo(() => {
    if (!editor) return <FormatAlignLeftIcon />;
    const a =
      editor.isActive({ textAlign: "center" }) ? "center" :
      editor.isActive({ textAlign: "right" }) ? "right" :
      editor.isActive({ textAlign: "justify" }) ? "justify" : "left";
    switch (a) {
      case "center": return <FormatAlignCenterIcon />;
      case "right": return <FormatAlignRightIcon />;
      case "justify": return <FormatAlignJustifyIcon />;
      default: return <FormatAlignLeftIcon />;
    }
  }, [editor]);

  // Inline style for editor content
  const editorBoxSx = {
    px: 1.5,
    py: 1,
    borderRadius: 1,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
    "& .ProseMirror": {
      outline: "none",
      minHeight: "140px",
      fontSize: ".95rem",
      lineHeight: 1.7,
      "& p.is-editor-empty:first-of-type::before": {
        content: "attr(data-placeholder)",
        float: "left",
        color: theme.palette.text.disabled,
        pointerEvents: "none",
        height: 0,
      },
      "& h1, & h2, & h3": {
        margin: "1rem 0 .5rem",
        lineHeight: 1.3,
      },
      "& ul, & ol": {
        paddingLeft: "1.25rem",
      },
      "& a": {
        color: theme.palette.primary.main,
        textDecoration: "underline",
      },
      "& img": {
        maxWidth: "100%",
        height: "auto",
        borderRadius: 4,
      },
    },
  };

  return (
    <Box>
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{
          px: 0.5,
          py: 0.5,
          border: `1px solid ${theme.palette.divider}`,
          borderBottom: "none",
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          bgcolor: theme.palette.background.paper,
          flexWrap: "wrap",
        }}
      >
        {/* Headings */}
        <Tooltip title="Paragraph">
          <span>
            <IconButton
              size="small"
              onClick={() => editor?.chain().focus().setParagraph().run()}
              color={editor?.isActive("paragraph") ? "primary" : "default"}
            >
              <TitleIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <ToolbarButton
          title="Heading 1"
          icon={<LooksOneIcon fontSize="small" />}
          active={editor?.isActive("heading", { level: 1 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          title="Heading 2"
          icon={<LooksTwoIcon fontSize="small" />}
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          title="Heading 3"
          icon={<Looks3Icon fontSize="small" />}
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Marks */}
        <ToolbarButton
          title="Bold"
          icon={<FormatBoldIcon fontSize="small" />}
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          title="Italic"
          icon={<FormatItalicIcon fontSize="small" />}
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          title="Underline"
          icon={<FormatUnderlinedIcon fontSize="small" />}
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          title="Strikethrough"
          icon={<StrikethroughSIcon fontSize="small" />}
          active={editor?.isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Lists */}
        <ToolbarButton
          title="Bullet list"
          icon={<FormatListBulletedIcon fontSize="small" />}
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          title="Numbered list"
          icon={<FormatListNumberedIcon fontSize="small" />}
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Alignment */}
        <ToggleButtonGroup
          exclusive
          size="small"
          value={[
            editor?.isActive({ textAlign: "left" }) && "left",
            editor?.isActive({ textAlign: "center" }) && "center",
            editor?.isActive({ textAlign: "right" }) && "right",
            editor?.isActive({ textAlign: "justify" }) && "justify",
          ].find(Boolean) || "left"}
          onChange={(_, val) => {
            if (!editor || !val) return;
            editor.chain().focus().setTextAlign(val).run();
          }}
        >
          <ToggleButton value="left"><FormatAlignLeftIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="center"><FormatAlignCenterIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="right"><FormatAlignRightIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="justify"><FormatAlignJustifyIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Link + Image */}
        <ToolbarButton title="Link" icon={<LinkIcon fontSize="small" />} onClick={setLink} />
        <ToolbarButton title="Unlink" icon={<LinkOffIcon fontSize="small" />} onClick={() => editor?.chain().focus().unsetLink().run()} />
        <ToolbarButton title="Insert image" icon={<ImageIcon fontSize="small" />} onClick={setImage} />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Color */}
        <TextField
          size="small"
          type="color"
          value={editor?.getAttributes("textStyle")?.color || "#000000"}
          onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
          sx={{ width: 48, minWidth: 48, p: 0, "& input": { p: 0, height: 28, cursor: "pointer" } }}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Undo/redo */}
        <Tooltip title="Undo">
          <span>
            <IconButton size="small" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo">
          <span>
            <IconButton size="small" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Box sx={editorBoxSx}>
        <EditorContent editor={editor} />
      </Box>

      {/* tiny helper actions for power users */}
      <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
        <Button
          size="small"
          onClick={() => editor?.chain().focus().clearNodes().setParagraph().unsetAllMarks().run()}
        >
          Clear formatting
        </Button>
        <Button
          size="small"
          onClick={() => {
            // Useful when pasting HTML from other tools
            const html = editor?.getHTML() || "";
            editor?.commands.setContent(html, true);
          }}
        >
          Normalize HTML
        </Button>
      </Stack>
    </Box>
  );
}
