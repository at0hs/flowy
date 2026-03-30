"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { EditorToolbar } from "./editor-toolbar";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  maxHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "内容を入力...",
  editable = true,
  maxHeight = "50rem",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
        },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editable,
    editorProps: {
      attributes: {
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {editable && <EditorToolbar editor={editor} />}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
