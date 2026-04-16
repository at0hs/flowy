"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import tippy, { type Instance } from "tippy.js";
import { toast } from "sonner";
import { registerAttachment, getAttachmentUrl } from "@/app/(app)/projects/[id]/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
import { EditorToolbar } from "./editor-toolbar";

export type MentionMember = { id: string; label: string };

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  maxHeight?: string;
  members?: MentionMember[];
  /** D&Dアップロードを有効にする場合に指定 */
  ticketId?: string;
  projectId?: string;
  /** アップロード完了後に呼ばれるコールバック（添付ファイルセクションの更新に使用） */
  onAttachmentUploaded?: () => void;
  /** D&Dされたファイルを受け取るコールバック（ticketId なしで使用する場合） */
  onFileDrop?: (files: File[]) => void;
  /** D&Dされた画像のプレビュー用 Blob URL を親に通知するコールバック（ticketId なしで使用する場合） */
  onImagePreview?: (file: File, blobUrl: string) => void;
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
    parseHTML() {
      return [
        {
          tag: "span[data-mention-id]",
          getAttrs: (element) => {
            if (typeof element === "string") return false;
            const id = (element as HTMLElement).getAttribute("data-mention-id");
            if (!id) return false;
            const label = (element as HTMLElement).textContent?.replace(/^@/, "") ?? "";
            return { id, label };
          },
        },
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
  ticketId,
  projectId,
  onAttachmentUploaded,
  onFileDrop,
  onImagePreview,
}: RichTextEditorProps) {
  const membersRef = useRef<MentionMember[]>(members ?? []);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      Image.configure({ inline: false, allowBase64: false }),
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

  const dndEnabled = editable && (!!onFileDrop || (!!ticketId && !!projectId));

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!dndEnabled) return;
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    // 子要素への移動は無視する（currentTarget の外に出たときのみ解除）
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    if (!dndEnabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // ticketId がない場合は onFileDrop コールバックにファイルを渡す
    // 画像ファイルは Blob URL でエディタにプレビュー挿入する
    if (!ticketId || !projectId) {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      for (const file of imageFiles) {
        const blobUrl = URL.createObjectURL(file);
        editor?.commands.setImage({ src: blobUrl });
        onImagePreview?.(file, blobUrl);
      }
      if (imageFiles.length > 0 && editor) {
        onChange(editor.getHTML());
      }
      onFileDrop?.(files);
      return;
    }

    setIsUploading(true);

    const supabase = createClient();
    try {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error("ファイルサイズは30MB以下にしてください");
          continue;
        }

        const filePath = `${projectId}/${ticketId}/${crypto.randomUUID()}-${file.name}`;
        const { error: storageError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (storageError) {
          toast.error(`${file.name} のアップロードに失敗しました`);
          continue;
        }

        const result = await registerAttachment(ticketId, projectId, {
          fileName: file.name,
          filePath,
          mimeType: file.type,
          fileSize: file.size,
        });
        if ("error" in result) {
          toast.error(result.error);
          await supabase.storage.from("attachments").remove([filePath]);
          continue;
        }

        if (file.type.startsWith("image/")) {
          // 署名付きURLを取得してエディタに画像として埋め込む
          const urlResult = await getAttachmentUrl(result.attachment.id);
          if ("error" in urlResult) {
            toast.error(urlResult.error);
          } else {
            editor?.commands.setImage({ src: urlResult.url });
            onChange(editor?.getHTML() ?? "");
          }
        } else {
          toast.success(`${file.name} をアップロードしました`);
        }

        onAttachmentUploaded?.();
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      className={[
        "border rounded-md overflow-hidden transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        isUploading ? "opacity-70 pointer-events-none" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={dndEnabled ? handleDragOver : undefined}
      onDragLeave={dndEnabled ? handleDragLeave : undefined}
      onDrop={dndEnabled ? handleDrop : undefined}
    >
      {editable && <EditorToolbar editor={editor} />}
      {isUploading && (
        <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50">
          アップロード中...
        </div>
      )}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
