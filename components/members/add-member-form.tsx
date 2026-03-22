"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { addProjectMember, searchProfiles } from "@/app/(app)/projects/actions";
import { Profile } from "@/types";

type Props = {
  projectId: string;
  onMemberAdded: (projectId: string) => void;
};

export function AddMemberForm({ projectId, onMemberAdded }: Props) {
  const [email, setEmail] = useState("");
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      setSelectedProfile(null);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (!value.trim()) {
        setCandidates([]);
        setOpen(false);
        return;
      }

      debounceTimer.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchProfiles(value.trim(), projectId);
          setCandidates(results);
          setOpen(results.length > 0);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [projectId]
  );

  const handleSelect = (profile: Profile) => {
    setSelectedProfile(profile);
    setEmail(profile.email);
    setOpen(false);
    setCandidates([]);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const targetEmail = selectedProfile?.email ?? email.trim();
    if (!targetEmail) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      await addProjectMember(projectId, targetEmail);
      setEmail("");
      setSelectedProfile(null);
      toast.success("メンバーを追加しました");
      onMemberAdded(projectId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "メンバーの追加に失敗しました";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="メールアドレスで検索"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onFocus={() => candidates.length > 0 && setOpen(true)}
              disabled={isLoading}
              autoComplete="off"
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                検索中...
              </span>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="p-0 w-(--radix-popover-trigger-width)"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList>
              <CommandEmpty>該当するユーザーが見つかりません</CommandEmpty>
              <CommandGroup>
                {candidates.map((profile) => (
                  <CommandItem
                    key={profile.id}
                    value={profile.email}
                    onSelect={() => handleSelect(profile)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{profile.username}</span>
                      <span className="text-xs text-muted-foreground">{profile.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button type="submit" disabled={isLoading || !email.trim()}>
        {isLoading ? "追加中..." : "追加"}
      </Button>
    </form>
  );
}
