
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.community_replies ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "posts public read" ON public.community_posts;
CREATE POLICY "posts read visible" ON public.community_posts FOR SELECT USING (
  is_hidden = false OR user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);
DROP POLICY IF EXISTS "posts own update" ON public.community_posts;
CREATE POLICY "posts update own or mod" ON public.community_posts FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);
DROP POLICY IF EXISTS "posts own delete" ON public.community_posts;
CREATE POLICY "posts delete own or mod" ON public.community_posts FOR DELETE TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);

DROP POLICY IF EXISTS "replies public read" ON public.community_replies;
CREATE POLICY "replies read visible" ON public.community_replies FOR SELECT USING (
  is_hidden = false OR user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);
DROP POLICY IF EXISTS "replies own update" ON public.community_replies;
CREATE POLICY "replies update own or mod" ON public.community_replies FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);
DROP POLICY IF EXISTS "replies own delete" ON public.community_replies;
CREATE POLICY "replies delete own or mod" ON public.community_replies FOR DELETE TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);

CREATE TABLE public.speaking_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  topic text NOT NULL DEFAULT 'Self introduction',
  level text NOT NULL DEFAULT 'beginner',
  focus text NOT NULL DEFAULT 'speaking',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer NOT NULL DEFAULT 30,
  capacity integer NOT NULL DEFAULT 4,
  meeting_link text,
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaking_rooms TO authenticated;
GRANT ALL ON public.speaking_rooms TO service_role;
ALTER TABLE public.speaking_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms read" ON public.speaking_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms insert own" ON public.speaking_rooms FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms update host or mod" ON public.speaking_rooms FOR UPDATE TO authenticated USING (
  host_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  host_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "rooms delete host or mod" ON public.speaking_rooms FOR DELETE TO authenticated USING (
  host_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);
CREATE TRIGGER speaking_rooms_touch BEFORE UPDATE ON public.speaking_rooms
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.speaking_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.room_members TO authenticated;
GRANT ALL ON public.room_members TO service_role;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room members read" ON public.room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "room members join" ON public.room_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "room members leave or mod" ON public.room_members FOR DELETE TO authenticated USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(),'mentor')
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.speaking_rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
);

CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports read own or mod" ON public.content_reports FOR SELECT TO authenticated USING (
  reporter_id = auth.uid() OR public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "reports insert own" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports update mod" ON public.content_reports FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')
);
CREATE TRIGGER content_reports_touch BEFORE UPDATE ON public.content_reports
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
