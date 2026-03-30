"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface RichTextContentProps {
  html: string | null;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState("");

  // DOMPurify はブラウザ環境でのみ動作するため useEffect でクライアントマウント後に実行する
  useEffect(() => {
    if (!html) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSanitizedHtml(DOMPurify.sanitize(html));
  }, [html]);

  if (!html) {
    return null;
  }

  return (
    <div
      className={cn("prose-tiptap text-sm", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
