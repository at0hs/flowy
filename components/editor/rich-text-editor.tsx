"use client";

import { useEffect, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import Mention from "@tiptap/extension-mention";
import tippy, { type Instance } from "tippy.js";
import { EditorToolbar } from "./editor-toolbar";

export type MentionMember = { id: string; label: string };

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  maxHeight?: string;
  members?: MentionMember[];
}

function buildMentionExtension(membersRef: React.RefObject<MentionMember[]>) {
  return Mention.extend({
    renderHTML({ node, HTMLAttributes }) {
      return [
        "span",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          "data-mention-id": node.attrs.id,
        }),
        `@${node.attrs.label ?? node.attrs.id}`,
      ];
    },
  }).configure({
    HTMLAttributes: { class: "mention" },
    suggestion: {
      items: ({ query }) => {
        const members = membersRef.current ?? [];
        return members
          .filter((m) => m.label.toLowerCase().startsWith(query.toLowerCase()))
          .slice(0, 8);
      },
      render: () => {
        let popup: Instance[];
        let selectedIndex = 0;
        let currentItems: MentionMember[] = [];
        let currentCommand: ((attrs: { id: string; label: string }) => void) | null = null;

        const container = document.createElement("div");
        container.className = "tiptap-mention-popup";

        const renderList = () => {
          container.innerHTML = "";
          if (currentItems.length === 0) {
            const empty = document.createElement("div");
            empty.className = "tiptap-mention-empty";
            empty.textContent = "メンバーが見つかりません";
            container.appendChild(empty);
            return;
          }
          currentItems.forEach((item, index) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = [
              "tiptap-mention-item",
              index === selectedIndex ? "tiptap-mention-item--selected" : "",
            ]
              .filter(Boolean)
              .join(" ");
            btn.textContent = `@${item.label}`;
            btn.addEventListener("mousedown", (e) => {
              e.preventDefault();
              currentCommand?.({ id: item.id, label: item.label });
            });
            btn.addEventListener("mouseenter", () => {
              selectedIndex = index;
              renderList();
            });
            container.appendChild(btn);
          });
        };

        return {
          onStart: (props) => {
            currentItems = props.items as MentionMember[];
            currentCommand = props.command;
            selectedIndex = 0;
            renderList();

            popup = tippy("body", {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: container,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
              arrow: false,
              offset: [0, 4],
              theme: "tiptap-mention",
            });
          },
          onUpdate: (props) => {
            currentItems = props.items as MentionMember[];
            currentCommand = props.command;
            selectedIndex = 0;
            renderList();
            popup[0]?.setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            });
          },
          onKeyDown: ({ event }) => {
            if (event.key === "ArrowUp") {
              selectedIndex =
                (selectedIndex - 1 + Math.max(currentItems.length, 1)) %
                Math.max(currentItems.length, 1);
              renderList();
              return true;
            }
            if (event.key === "ArrowDown") {
              selectedIndex = (selectedIndex + 1) % Math.max(currentItems.length, 1);
              renderList();
              return true;
            }
            if ((event.key === "Enter" || event.key === "Tab") && currentItems.length > 0) {
              const item = currentItems[selectedIndex];
              if (item) {
                currentCommand?.({ id: item.id, label: item.label });
              }
              return true;
            }
            return false;
          },
          onExit: () => {
            popup[0]?.destroy();
          },
        };
      },
    },
  });
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "内容を入力...",
  editable = true,
  maxHeight = "50rem",
  members,
}: RichTextEditorProps) {
  const membersRef = useRef<MentionMember[]>(members ?? []);

  useEffect(() => {
    membersRef.current = members ?? [];
  }, [members]);

  // members の有無が変わらない前提で初回マウント時のみ生成
  const mentionExtension = useMemo(
    () => (members !== undefined ? buildMentionExtension(membersRef) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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
      ...(mentionExtension ? [mentionExtension] : []),
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
