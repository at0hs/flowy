'use client';

import { useState } from 'react';
import { updateProfile } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Profile } from '@/types';

type Props = {
  profile: Pick<Profile, 'username' | 'email'>;
};

export function UpdateProfileForm({ profile }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    if (result?.emailChanged) {
      toast.success('プロフィールを更新しました。\n新しいメールアドレスに確認メールを送信しました。');
    } else {
      toast.success('プロフィールを更新しました');
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">ユーザー名 *</Label>
        <Input
          id="username"
          name="username"
          defaultValue={profile.username}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={profile.email}
          required
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '更新中...' : '更新する'}
        </Button>
      </div>
    </form>
  );
}
