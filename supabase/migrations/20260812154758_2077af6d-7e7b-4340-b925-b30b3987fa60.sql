ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learning_goals text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_level text NOT NULL DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS weekly_goal_minutes integer NOT NULL DEFAULT 300;