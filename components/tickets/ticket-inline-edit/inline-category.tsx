import { Badge } from "@/components/ui/badge";
import { CategoryType } from "@/types";
import { CATEGORY_CONFIG } from "@/lib/ticket-config";
import { cn } from "@/lib/utils";

type Props = {
  value: CategoryType;
};

export function InlineCategory({ value }: Props) {
  const cat = CATEGORY_CONFIG[value];
  return (
    <Badge variant="outline" className={cn("rounded-sm", "gap-1")}>
      <cat.icon className={cn("w-3 h-3", cat.iconColor)} />
      {cat.label}
    </Badge>
  );
}
