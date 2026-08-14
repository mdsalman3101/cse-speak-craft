DROP VIEW IF EXISTS public.public_profiles;

CREATE TABLE public.public_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  current_level text NOT NULL DEFAULT 'beginner',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT ALL ON public.public_profiles TO service_role;

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public profiles readable by authenticated"
ON public.public_profiles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_profiles (id, full_name, avatar_url, current_level, updated_at)
  VALUES (NEW.id, COALESCE(NEW.full_name,''), NEW.avatar_url, COALESCE(NEW.current_level,'beginner'), now())
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        current_level = EXCLUDED.current_level,
        updated_at = now();
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.sync_public_profile() FROM public, anon, authenticated;

CREATE TRIGGER profiles_sync_public
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

INSERT INTO public.public_profiles (id, full_name, avatar_url, current_level)
SELECT id, COALESCE(full_name,''), avatar_url, COALESCE(current_level,'beginner') FROM public.profiles
ON CONFLICT (id) DO NOTHING;