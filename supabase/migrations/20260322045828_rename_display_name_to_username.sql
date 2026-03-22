-- Rename display_name column to username in profiles table
ALTER TABLE public.profiles RENAME COLUMN display_name TO username;
