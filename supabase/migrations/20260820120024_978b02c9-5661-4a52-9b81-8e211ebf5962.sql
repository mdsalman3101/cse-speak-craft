-- 1) live_sessions: hide meeting_link behind registration
REVOKE SELECT ON public.live_sessions FROM authenticated;
GRANT SELECT (id, title, description, mentor_id, mentor_name, session_date, session_time, status, created_at)
  ON public.live_sessions TO authenticated;

CREATE OR REPLACE FUNCTION public.get_session_meeting_link(_session_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.meeting_link
  FROM public.live_sessions s
  WHERE s.id = _session_id
    AND (
      private.has_role(auth.uid(), 'mentor'::app_role)
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.session_registrations r
        WHERE r.session_id = s.id AND r.user_id = auth.uid()
      )
    )
$$;
REVOKE ALL ON FUNCTION public.get_session_meeting_link(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_session_meeting_link(uuid) TO authenticated;

-- 2) room_members: restrict reads to own rooms / host / staff
CREATE OR REPLACE FUNCTION private.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members m
    WHERE m.room_id = _room_id AND m.user_id = _user_id
  )
$$;
REVOKE ALL ON FUNCTION private.is_room_member(uuid, uuid) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "room members read" ON public.room_members;
CREATE POLICY "room members read scoped" ON public.room_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR private.is_room_member(room_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.speaking_rooms r WHERE r.id = room_members.room_id AND r.host_id = auth.uid())
  OR private.has_role(auth.uid(), 'mentor'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
);

CREATE OR REPLACE FUNCTION public.room_seat_counts()
RETURNS TABLE (room_id uuid, seats integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.room_id, count(*)::int AS seats
  FROM public.room_members m
  GROUP BY m.room_id
$$;
REVOKE ALL ON FUNCTION public.room_seat_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.room_seat_counts() TO authenticated;

-- 3) public_profiles: scope directory reads to shared context
DROP POLICY IF EXISTS "public profiles readable by authenticated" ON public.public_profiles;
CREATE POLICY "public profiles scoped read" ON public.public_profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR private.has_role(auth.uid(), 'mentor'::app_role)
  OR private.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.user_id = public_profiles.id AND p.is_hidden = false
  )
  OR EXISTS (
    SELECT 1 FROM public.community_replies rp
    WHERE rp.user_id = public_profiles.id AND rp.is_hidden = false
  )
  OR EXISTS (
    SELECT 1 FROM public.speaking_rooms r
    WHERE r.host_id = public_profiles.id
  )
  OR EXISTS (
    SELECT 1 FROM public.room_members m
    WHERE m.user_id = public_profiles.id
      AND private.is_room_member(m.room_id, auth.uid())
  )
);
