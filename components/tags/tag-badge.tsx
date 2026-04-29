import { Tag } from "lucide-react";

type Props = {
  name: string;
  color: string | null;
};

export function TagBadge({ name, color }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium"
      style={
        color
          ? { backgroundColor: `${color}22`, color, border: `1px solid ${color}66` }
          : { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
      }
    >
      {color && <Tag color={color} className="size-4 shrink-0" />}
      {name}
    </span>
  );
}
