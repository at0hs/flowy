"use client";

import { useState } from "react";
import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Quote,
  Table2,
  Link,
  Trash2,
  SquarePlusIcon,
  SquareMinusIcon,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

const getActiveClass = (isActive: boolean) =>
  isActive
    ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30 hover:bg-primary/20 hover:text-primary"
    : "";

/**
 * 基本的なテキスト編集ツールバー（見出し・装飾・リスト・ブロック）
 */
function PrimaryToolbar({ editor }: { editor: Editor }) {
  const activeStates = useEditorState({
    editor,
    selector: (ctx) => ({
      h1: ctx.editor?.isActive("heading", { level: 1 }) ?? false,
      h2: ctx.editor?.isActive("heading", { level: 2 }) ?? false,
      h3: ctx.editor?.isActive("heading", { level: 3 }) ?? false,
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      strike: ctx.editor?.isActive("strike") ?? false,
      bulletList: ctx.editor?.isActive("bulletList") ?? false,
      orderedList: ctx.editor?.isActive("orderedList") ?? false,
      codeBlock: ctx.editor?.isActive("codeBlock") ?? false,
      blockquote: ctx.editor?.isActive("blockquote") ?? false,
    }),
  });

  return (
    <>
      {/* 見出し */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.h1)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="見出し1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.h2)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="見出し2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.h3)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="見出し3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* テキスト装飾 */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.bold)}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="太字"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.italic)}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="斜体"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.strike)}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        aria-label="取り消し線"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* リスト */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.bulletList)}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="箇条書きリスト"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.orderedList)}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="番号付きリスト"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* ブロック */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.codeBlock)}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label="コードブロック"
      >
        <Code2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={getActiveClass(activeStates.blockquote)}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="引用"
      >
        <Quote className="h-4 w-4" />
      </Button>
    </>
  );
}

/**
 * テーブル挿入ツール
 * ステートフルコンポーネント（テーブルの行数・列数を管理）
 */
function TableInsertItem({ editor }: { editor: Editor }) {
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="ghost" aria-label="テーブル挿入">
          <Table2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" align="start">
        <div className="space-y-2">
          <p className="text-xs font-medium">テーブルを挿入</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-6">行</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={tableRows}
              onChange={(e) => setTableRows(Math.max(1, Number(e.target.value)))}
              className="h-7 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-6">列</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={tableCols}
              onChange={(e) => setTableCols(Math.max(1, Number(e.target.value)))}
              className="h-7 text-sm"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={() => {
              editor
                .chain()
                .focus()
                .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true })
                .run();
              setIsOpen(false);
            }}
          >
            挿入
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * リンク追加・編集ツール
 * ステートフルコンポーネント（リンクURL・テキスト・Popover状態を管理）
 */
function LinkToolbarItem({ editor }: { editor: Editor }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const isLinkActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive("link") ?? false,
  });

  function applyLink() {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: linkText ? linkText : linkUrl,
          marks: [{ type: "link", attrs: { href: linkUrl } }],
        })
        .run();
    }
    setLinkUrl("");
    setLinkText("");
    setIsOpen(false);
  }

  function openLinkPopover() {
    const currentHref = editor.getAttributes("link").href ?? "";
    setLinkUrl(currentHref);
    if (currentHref) {
      // リンク全体を選択範囲に広げる（focus()を呼ぶとPopoverが閉じるため除外）
      editor.chain().extendMarkRange("link").run();
      const { from, to } = editor.state.selection;
      const currentLinkText = editor.state.doc.textBetween(from, to);
      setLinkText(currentLinkText);
    }
    setIsOpen(true);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={getActiveClass(isLinkActive)}
          onClick={openLinkPopover}
          aria-label="リンク"
        >
          <Link className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">リンクURL</p>
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">リンクテキスト (オプション)</p>
          <Input
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={applyLink}>
              適用
            </Button>
            {isLinkActive && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setIsOpen(false);
                }}
              >
                解除
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * テーブル操作ツール（テーブル内でのみ表示）
 */
function TableActionToolbar({ editor }: { editor: Editor }) {
  const hasHeaderRow = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return false;
      const { $from } = ctx.editor.state.selection;
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === "table") {
          const firstRow = node.firstChild;
          return firstRow?.firstChild?.type.name === "tableHeader";
        }
      }
      return false;
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-1 p-1">
      <label className="flex items-center gap-1.5 cursor-pointer px-1 select-none">
        <span className="text-xs text-muted-foreground">ヘッダー:</span>
        <Checkbox
          checked={hasHeaderRow}
          onCheckedChange={() => editor.chain().focus().toggleHeaderRow().run()}
        />
      </label>
      <Separator orientation="vertical" className="h-6" />
      <span className="text-xs text-muted-foreground px-1">行:</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        aria-label="行を追加"
      >
        <SquarePlusIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().deleteRow().run()}
        aria-label="行を削除"
      >
        <SquareMinusIcon className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <span className="text-xs text-muted-foreground px-1">列:</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        aria-label="列を追加"
      >
        <SquarePlusIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        aria-label="列を削除"
      >
        <SquareMinusIcon className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().deleteTable().run()}
        aria-label="テーブル削除"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * エディタツールバー（メインコンポーネント）
 */
export function EditorToolbar({ editor }: EditorToolbarProps) {
  const isInTable = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive("table") ?? false,
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col border-b border-border bg-muted/30">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border">
        <PrimaryToolbar editor={editor} />
        <Separator orientation="vertical" className="h-6" />
        <TableInsertItem editor={editor} />
        <LinkToolbarItem editor={editor} />
      </div>
      {isInTable && <TableActionToolbar editor={editor} />}
    </div>
  );
}
