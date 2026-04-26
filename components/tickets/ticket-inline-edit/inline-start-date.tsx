"use client";

import { InlineDate } from "./inline-date";

type Props = {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  disabled?: boolean;
};

export function InlineStartDate({ value, onSave, disabled }: Props) {
  return <InlineDate value={value} onSave={onSave} disabled={disabled} placeholder="開始日なし" />;
}
