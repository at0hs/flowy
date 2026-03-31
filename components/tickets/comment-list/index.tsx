"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CommentWithProfile } from "@/lib/supabase/comments";
import {
  addComment,
  addReply,
  editComment,
  removeComment,
} from "@/app/(app)/projects/[id]/actions";
import { SquarePen, Trash2, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { RichTextContent } from "@/components/editor/rich-text-content";

type Props = {
  comments: CommentWithProfile[];
  ticketId: string;
  currentUserId: string;
};

export function CommentList({ comments, ticketId, currentUserId }: Props) {
  const [newBody, setNewBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [newCommentWriting, setNewCommentWriting] = useState(false);
  const [replyingToRootId, setReplyingToRootId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const [isPostPending, startPostTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isReplyPending, startReplyTransition] = useTransition();
  const router = useRouter();

  const handlePost = () => {
    if (isHtmlEmpty(newBody)) return;
    startPostTransition(async () => {
      const result = await addComment(ticketId, newBody);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setNewBody("");
        setNewCommentWriting(false);
        router.refresh();
      }
    });
  };

  const handleReply = (rootId: string) => {
    if (isHtmlEmpty(replyBody)) return;
    startReplyTransition(async () => {
      const result = await addReply(ticketId, replyBody, rootId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setReplyBody("");
        setReplyingToRootId(null);
        router.refresh();
      }
    });
  };

  const handleEditSave = (commentId: string) => {
    if (isHtmlEmpty(editBody)) return;
    startEditTransition(async () => {
      const result = await editComment(commentId, editBody);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setEditingId(null);
        router.refresh();
      }
    });
  };

  const handleDelete = (commentId: string) => {
    startDeleteTransition(async () => {
      const result = await removeComment(commentId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setDeleteTargetId(null);
        toast.success("コメントを削除しました");
        router.refresh();
      }
    });
  };

  // ルートコメントと返信を分類
  const rootComments = comments.filter((c) => c.reply_to_id === null);
  const repliesByRootId = comments
    .filter((c) => c.reply_to_id !== null)
    .reduce<Record<string, CommentWithProfile[]>>((acc, reply) => {
      const rootId = reply.reply_to_id!;
      if (!acc[rootId]) acc[rootId] = [];
      acc[rootId].push(reply);
      return acc;
    }, {});

  const totalCount = comments.filter((c) => !c.is_deleted).length;

  const commonItemProps = {
    currentUserId,
    editingId,
    editBody,
    deleteTargetId,
    isEditPending,
    isDeletePending,
    onEditStart: (id: string, body: string) => {
      setEditingId(id);
      setEditBody(body);
    },
    onEditBodyChange: setEditBody,
    onEditSave: handleEditSave,
    onEditCancel: () => setEditingId(null),
    onDeleteRequest: setDeleteTargetId,
    onDeleteCancel: () => setDeleteTargetId(null),
    onDeleteConfirm: handleDelete,
    onReplyRequest: (rootId: string) => {
      setReplyingToRootId(rootId);
      setReplyBody("");
    },
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-4">コメント ({totalCount})</h3>

      {/* 投稿フォーム */}
      <div className="space-y-2 pb-10">
        {newCommentWriting ? (
          <>
            <RichTextEditor
              value={newBody}
              onChange={setNewBody}
              placeholder="コメントを入力..."
              maxHeight="16rem"
              editable={!isPostPending}
            />
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                onClick={handlePost}
                disabled={isPostPending || isHtmlEmpty(newBody)}
              >
                {isPostPending ? "投稿中..." : "投稿"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewCommentWriting(false);
                  setNewBody("");
                }}
              >
                キャンセル
              </Button>
            </div>
          </>
        ) : (
          <div
            onClick={() => setNewCommentWriting(true)}
            className="rounded-md border border-border p-3 min-h-20 transition-colors cursor-pointer hover:bg-muted/30"
          >
            <p className="text-sm text-muted-foreground italic">コメントを入力</p>
          </div>
        )}
      </div>

      {/* コメント一覧 */}
      {totalCount === 0 ? (
        <p className="text-sm text-muted-foreground mb-6">コメントはありません</p>
      ) : (
        <div className="space-y-6 mb-6">
          {rootComments.map((comment) => {
            const hasReplies = !!repliesByRootId[comment.id]?.length;
            const isReplyingToThis = replyingToRootId === comment.id;
            const showReplyThread = hasReplies || (!comment.is_deleted && isReplyingToThis);

            return (
              <div key={comment.id}>
                {/* ルートコメント */}
                <CommentItem {...commonItemProps} comment={comment} rootId={comment.id} />

                {/* 返信一覧＋返信フォーム（1階層インデント） */}
                {showReplyThread && (
                  <div className="mt-3 ml-8 space-y-3 border-l-2 border-border pl-4">
                    {repliesByRootId[comment.id]?.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        {...commonItemProps}
                        comment={reply}
                        rootId={comment.id}
                      />
                    ))}

                    {/* 返信フォーム（ソフトデリートコメントには表示しない） */}
                    {isReplyingToThis && (
                      <div className="space-y-2 pt-1">
                        <RichTextEditor
                          value={replyBody}
                          onChange={setReplyBody}
                          placeholder="返信を入力..."
                          maxHeight="12rem"
                          editable={!isReplyPending}
                        />
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleReply(comment.id)}
                            disabled={isReplyPending || isHtmlEmpty(replyBody)}
                          >
                            {isReplyPending ? "投稿中..." : "返信"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingToRootId(null);
                              setReplyBody("");
                            }}
                          >
                            キャンセル
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type CommentItemProps = {
  comment: CommentWithProfile;
  rootId: string;
  currentUserId: string;
  editingId: string | null;
  editBody: string;
  deleteTargetId: string | null;
  isEditPending: boolean;
  isDeletePending: boolean;
  onEditStart: (id: string, body: string) => void;
  onEditBodyChange: (body: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string) => void;
  onReplyRequest: (rootId: string) => void;
};

function CommentItem({
  comment,
  rootId,
  currentUserId,
  editingId,
  editBody,
  deleteTargetId,
  isEditPending,
  isDeletePending,
  onEditStart,
  onEditBodyChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  onReplyRequest,
}: CommentItemProps) {
  const isEditing = editingId === comment.id;

  // ソフトデリートされたコメントはプレースホルダーを表示
  if (comment.is_deleted) {
    return (
      <div className="text-sm text-muted-foreground italic py-1">このコメントは削除されました</div>
    );
  }

  return (
    <div className="text-sm">
      {/* ヘッダー行：ユーザー名（左）・投稿日時＋アクションボタン（右） */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium">
          {comment.profile ? comment.profile.username : "削除済みユーザー"}
          <span className="text-xs text-muted-foreground pl-2">
            {formatCommentDate(comment.created_at, comment.updated_at)}
          </span>
        </span>
        <div className="flex items-center gap-1">
          {/* 返信ボタン（編集中は非表示） */}
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => onReplyRequest(rootId)}
            >
              <CornerDownRight className="h-3 w-3 mr-1" />
              返信
            </Button>
          )}

          {/* 編集・削除ボタン（自分のコメントのみ） */}
          {comment.user_id === currentUserId && !isEditing && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onEditStart(comment.id, comment.body)}
                disabled={isEditPending}
              >
                <SquarePen className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => onDeleteRequest(comment.id)}
                disabled={isDeletePending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Dialog
                open={deleteTargetId === comment.id}
                onOpenChange={(open) => !open && onDeleteCancel()}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>コメントを削除しますか？</DialogTitle>
                    <DialogDescription>この操作は取り消せません。</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={onDeleteCancel} disabled={isDeletePending}>
                      キャンセル
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => onDeleteConfirm(comment.id)}
                      disabled={isDeletePending}
                    >
                      {isDeletePending ? "削除中..." : "削除"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <RichTextEditor
            value={editBody}
            onChange={onEditBodyChange}
            maxHeight="16rem"
            editable={!isEditPending}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onEditSave(comment.id)}
              disabled={isEditPending || isHtmlEmpty(editBody)}
            >
              {isEditPending ? "保存中..." : "保存"}
            </Button>
            <Button variant="outline" size="sm" onClick={onEditCancel} disabled={isEditPending}>
              キャンセル
            </Button>
          </div>
        </div>
      ) : (
        <div className="pl-4 min-h-6 whitespace-pre-wrap">
          <RichTextContent html={comment.body} />
        </div>
      )}
    </div>
  );
}

function isHtmlEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim() === "";
}

function formatAbsoluteDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}秒前`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間前`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)}日前`;
  return formatAbsoluteDate(dateStr);
}

function formatCommentDate(createdAt: string, updatedAt: string): string {
  const isEdited = new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
  const base = formatRelativeTime(createdAt);
  return isEdited ? `${base}（編集済み）` : base;
}
