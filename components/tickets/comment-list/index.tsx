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
} from "@/app/(app)/projects/[id]/actions/comments";
import { SquarePen, Trash2, CornerDownRight, LoaderCircle } from "lucide-react";
import { CommentReaction } from "./comment-reaction";
import type { CommentWithReactions } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { differenceInMilliseconds } from "date-fns";
import { formatRelativeTime } from "@/lib/date";
import { RichTextEditor, type MentionMember } from "@/components/editor/rich-text-editor";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { UserAvatar } from "@/components/ui/user-avatar";

type Props = {
  comments: CommentWithProfile[];
  ticketId: string;
  projectId: string;
  currentUserId: string;
  members?: MentionMember[];
  initialReactions: CommentWithReactions;
};

export function CommentList({
  comments,
  ticketId,
  projectId,
  currentUserId,
  members,
  initialReactions,
}: Props) {
  const router = useRouter();
  const [newBody, setNewBody] = useState("");
  const [newCommentWriting, setNewCommentWriting] = useState(false);
  const [isPostPending, startPostTransition] = useTransition();

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

  const threadProps = { ticketId, projectId, currentUserId, members, initialReactions };

  return (
    <div>
      {/* 投稿フォーム */}
      <div className="space-y-2 pb-10">
        {newCommentWriting ? (
          <CommentForm
            value={newBody}
            onChange={setNewBody}
            onSubmit={handlePost}
            onCancel={() => {
              setNewCommentWriting(false);
              setNewBody("");
            }}
            isPending={isPostPending}
            submitLabel="投稿"
            placeholder="コメントを入力..."
            members={members}
          />
        ) : (
          <div
            onClick={() => setNewCommentWriting(true)}
            className="rounded-md border border-border p-3 min-h-16 transition-colors cursor-pointer hover:bg-muted/30"
          >
            <p className="text-sm text-muted-foreground italic">コメントを入力</p>
          </div>
        )}
      </div>

      {/* コメント一覧 */}
      {totalCount > 0 && (
        <div className="space-y-6 mb-6">
          {rootComments.map((comment) => (
            <CommentThread
              key={comment.id}
              {...threadProps}
              comment={comment}
              replies={repliesByRootId[comment.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type CommentThreadProps = {
  comment: CommentWithProfile;
  replies: CommentWithProfile[];
  ticketId: string;
  projectId: string;
  currentUserId: string;
  members?: MentionMember[];
  initialReactions: CommentWithReactions;
};

function CommentThread({
  comment,
  replies,
  ticketId,
  projectId,
  currentUserId,
  members,
  initialReactions,
}: CommentThreadProps) {
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isReplyPending, startReplyTransition] = useTransition();

  const handleReply = () => {
    if (isHtmlEmpty(replyBody)) return;
    startReplyTransition(async () => {
      const result = await addReply(ticketId, replyBody, comment.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setReplyBody("");
        setIsReplying(false);
        router.refresh();
      }
    });
  };

  const startReply = () => {
    setReplyBody("");
    setIsReplying(true);
  };

  const itemProps = { ticketId, projectId, currentUserId, members, initialReactions };

  const hasReplies = replies.length > 0;
  const showReplyThread = hasReplies || (!comment.is_deleted && isReplying);

  return (
    <div>
      {/* ルートコメント */}
      <CommentItem {...itemProps} comment={comment} onReply={startReply} />

      {/* 返信一覧＋返信フォーム（1階層インデント） */}
      {showReplyThread && (
        <div className="mt-3 ml-8 space-y-3 border-l-2 border-border pl-4">
          {replies.map((reply) => (
            <CommentItem key={reply.id} {...itemProps} comment={reply} onReply={startReply} />
          ))}

          {/* 返信フォーム（ソフトデリートコメントには表示しない） */}
          {isReplying && (
            <div className="pt-1">
              <CommentForm
                value={replyBody}
                onChange={setReplyBody}
                onSubmit={handleReply}
                onCancel={() => {
                  setIsReplying(false);
                  setReplyBody("");
                }}
                isPending={isReplyPending}
                submitLabel="返信"
                placeholder="返信を入力..."
                members={members}
                maxHeight="12rem"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type CommentItemProps = {
  comment: CommentWithProfile;
  ticketId: string;
  projectId: string;
  currentUserId: string;
  members?: MentionMember[];
  initialReactions: CommentWithReactions;
  onReply: () => void;
};

function CommentItem({
  comment,
  ticketId,
  projectId,
  currentUserId,
  members,
  initialReactions,
  onReply,
}: CommentItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditPending, startEditTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const handleEditStart = () => {
    setEditBody(comment.body);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (isHtmlEmpty(editBody)) return;
    startEditTransition(async () => {
      const result = await editComment(comment.id, editBody);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await removeComment(comment.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setDeleteOpen(false);
        toast.success("コメントを削除しました");
        router.refresh();
      }
    });
  };

  // ソフトデリートされたコメントはプレースホルダーを表示
  if (comment.is_deleted) {
    return (
      <div className="text-sm text-muted-foreground italic py-1">このコメントは削除されました</div>
    );
  }

  const username = comment.profile ? comment.profile.username : "削除済みユーザー";

  return (
    <div className="flex gap-3 text-sm">
      <UserAvatar
        avatarFilePath={comment.profile?.avatar_file_path}
        username={username}
        size="sm"
        className="shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        {/* ヘッダー行：ユーザー名・投稿日時 */}
        <div className="flex items-center mb-1">
          <span className="font-medium">{username}</span>
          <span className="text-xs text-muted-foreground pl-2">
            {formatCommentDate(comment.created_at, comment.updated_at)}
          </span>
        </div>

        {isEditing ? (
          <CommentForm
            value={editBody}
            onChange={setEditBody}
            onSubmit={handleEditSave}
            onCancel={() => setIsEditing(false)}
            isPending={isEditPending}
            submitLabel="保存"
            members={members}
            align="start"
          />
        ) : (
          <div className="min-h-6 whitespace-pre-wrap">
            <RichTextContent html={comment.body} />
          </div>
        )}
        {!isEditing && (
          <div className="flex items-center gap-1 mt-1">
            {/* 返信ボタン */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              onClick={onReply}
              tooltip="返信"
            >
              <CornerDownRight className="h-3.5 w-3.5" />
            </Button>

            {/* リアクションボタン */}
            <CommentReaction
              commentId={comment.id}
              ticketId={ticketId}
              projectId={projectId}
              currentUserId={currentUserId}
              initialReactions={initialReactions[comment.id] ?? []}
            />

            {/* 編集・削除ボタン（自分のコメントのみ） */}
            {comment.user_id === currentUserId && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={handleEditStart}
                  disabled={isEditPending}
                  tooltip="編集"
                >
                  <SquarePen className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isDeletePending}
                  tooltip="削除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Dialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>コメントを削除しますか？</DialogTitle>
                      <DialogDescription>この操作は取り消せません。</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteOpen(false)}
                        disabled={isDeletePending}
                      >
                        キャンセル
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeletePending}
                      >
                        {isDeletePending ? <LoaderCircle className="animate-spin" /> : "削除"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type CommentFormProps = {
  value: string;
  onChange: (body: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
  placeholder?: string;
  members?: MentionMember[];
  maxHeight?: string;
  align?: "start" | "end";
};

function CommentForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
  placeholder,
  members,
  maxHeight = "16rem",
  align = "end",
}: CommentFormProps) {
  return (
    <div className="space-y-2">
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxHeight={maxHeight}
        editable={!isPending}
        members={members}
      />
      <div className={align === "start" ? "flex gap-2" : "flex justify-end gap-1"}>
        <Button size="sm" onClick={onSubmit} disabled={isPending || isHtmlEmpty(value)}>
          {isPending ? <LoaderCircle className="animate-spin" /> : submitLabel}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}

function isHtmlEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim() === "";
}

function formatCommentDate(createdAt: string, updatedAt: string): string {
  const isEdited = differenceInMilliseconds(new Date(updatedAt), new Date(createdAt)) > 1000;
  const base = formatRelativeTime(createdAt);
  return isEdited ? `${base}（編集済み）` : base;
}
