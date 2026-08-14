-- 1. profiles: restrict to owner + staff
DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
CREATE POLICY "profiles readable by owner or staff" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));

-- safe public directory view (non-sensitive columns only)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, full_name, avatar_url, current_level FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT ALL ON public.public_profiles TO service_role;

-- 2. live_sessions: authenticated only
DROP POLICY IF EXISTS "sessions public read" ON public.live_sessions;
CREATE POLICY "sessions read authenticated" ON public.live_sessions
FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.live_sessions FROM anon;

-- 3. community: authenticated only
DROP POLICY IF EXISTS "posts read visible" ON public.community_posts;
CREATE POLICY "posts read visible" ON public.community_posts
FOR SELECT TO authenticated
USING (is_hidden = false OR user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));
REVOKE SELECT ON public.community_posts FROM anon;

DROP POLICY IF EXISTS "replies read visible" ON public.community_replies;
CREATE POLICY "replies read visible" ON public.community_replies
FOR SELECT TO authenticated
USING (is_hidden = false OR user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));
REVOKE SELECT ON public.community_replies FROM anon;

-- 4. lock down security definer trigger functions from direct API calls
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM public, anon, authenticated;