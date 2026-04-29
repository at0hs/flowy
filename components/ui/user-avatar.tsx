"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export type AvatarSize = "sm" | "default" | "lg" | "xl";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "avatars";

const AVATAR_COLORS = [
	"bg-red-200",
	"bg-orange-200",
	"bg-amber-200",
	"bg-yellow-200",
	"bg-green-200",
	"bg-emerald-200",
	"bg-blue-200",
	"bg-indigo-200",
	"bg-purple-200",
	"bg-pink-200",
];

const AVATAR_SIZE_MAP: Record<AvatarSize, { container: "default" | "sm" | "lg" | "xl"; text: string; icon: string }> = {
	sm: {
		container: "sm",
		text: "text-lg",
		icon: "size-4",
	},
	default: {
		container: "default",
		text: "text-sm",
		icon: "size-4",
	},
	lg: {
		container: "lg",
		text: "text-xl",
		icon: "size-6",
	},
	xl: {
		container: "xl",
		text: "text-4xl",
		icon: "size-10",
	},
};

interface UserAvatarProps {
	avatarFilePath?: string | null | undefined;
  username?: string;
  size?: AvatarSize;
  className?: string;
}

export function UserAvatar({ avatarFilePath, username, size = "default", className }: UserAvatarProps) {
	const sizeMap = AVATAR_SIZE_MAP[size];
	const src = avatarFilePath ? getAvatarPublicUrl(avatarFilePath) : undefined;
	if (!username) {
		return (
			<Avatar size={sizeMap.container} className={className}>
				<AvatarImage src={src} alt={"ユーザーなし"} />
				<AvatarFallback className="bg-slate-100"><User className={cn(sizeMap.icon)}/></AvatarFallback>
			</Avatar>
		);
	}

	const fallback = username.charAt(0).toUpperCase();
	const bgColor = getColorClass(username);

  return (
		<Avatar size={sizeMap.container} className={className}>
      <AvatarImage src={src} alt={username} />
      <AvatarFallback className={cn(bgColor, sizeMap.text, "font-semibold")}>{fallback}</AvatarFallback>
    </Avatar>
  );
}

function getAvatarPublicUrl(avatarFilePath: string): string {
	return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${avatarFilePath}`;
}

// 文字列を数値に変換して色を決定する関数
const getColorClass = (name: string) => {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % AVATAR_COLORS.length;
	return AVATAR_COLORS[index];
};
