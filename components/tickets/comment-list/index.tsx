"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CommentWithProfile } from "@/lib/supabase/comments";
import { addComment, editComment, removeComment } from "@/app/(app)/projects/[id]/actions";
import { SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [isPostPending, startPostTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  const handlePost = () => {
    if (!newBody.trim()) return;
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

  const handleEditSave = (commentId: string) => {
    if (!editBody.trim()) return;
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

  return (
    <div>
      <h3 className="text-sm font-medium mb-4">コメント ({comments.length})</h3>

      {/* 投稿フォーム */}
      <div className="space-y-2 pb-10">
        <Textarea
          placeholder="コメントを入力..."
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={3}
          disabled={isPostPending}
          onClick={() => setNewCommentWriting(true)}
        />
        {newCommentWriting && (
          <div className="flex justify-end gap-1">
            <Button size="sm" onClick={handlePost} disabled={isPostPending || !newBody.trim()}>
              {isPostPending ? "投稿中..." : "投稿"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setNewCommentWriting(false)}>
              キャンセル
            </Button>
          </div>
        )}
      </div>

      {/* コメント一覧 */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-6">コメントはありません</p>
      ) : (
        <div className="space-y-6 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="text-sm">
              {/* ヘッダー行：ユーザー名（左）・投稿日時＋アクションボタン（右） */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">
                  {comment.profile ? comment.profile.username : "削除済みユーザー"}
                  <span className="text-xs text-muted-foreground pl-2">
                    {formatCommentDate(comment.created_at, comment.updated_at)}
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  {comment.user_id === currentUserId && editingId !== comment.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditBody(comment.body);
                        }}
                        disabled={isEditPending}
                      >
                        <SquarePen className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTargetId(comment.id)}
                        disabled={isDeletePending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Dialog
                        open={deleteTargetId === comment.id}
                        onOpenChange={(open) => !open && setDeleteTargetId(null)}
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>コメントを削除しますか？</DialogTitle>
                            <DialogDescription>この操作は取り消せません。</DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteTargetId(null)}
                              disabled={isDeletePending}
                            >
                              キャンセル
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(comment.id)}
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

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    disabled={isEditPending}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditSave(comment.id)}
                      disabled={isEditPending || !editBody.trim()}
                    >
                      {isEditPending ? "保存中..." : "保存"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      disabled={isEditPending}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pl-4 min-h-6 whitespace-pre-wrap">{comment.body}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
