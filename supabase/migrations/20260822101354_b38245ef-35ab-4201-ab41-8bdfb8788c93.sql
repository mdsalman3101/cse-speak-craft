CREATE OR REPLACE FUNCTION public.room_activity(_room_id uuid)
RETURNS TABLE(
  id uuid,
  action text,
  category text,
  summary text,
  actor_id uuid,
  actor_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.action, a.category, a.summary, a.actor_id,
         COALESCE(NULLIF(btrim(p.full_name), ''), 'Learner') AS actor_name,
         a.created_at
  FROM public.audit_log a
  LEFT JOIN public.public_profiles p ON p.id = a.actor_id
  WHERE a.target_id = _room_id
    AND a.target_type = 'room'
    AND (
      private.has_role(auth.uid(), 'mentor'::app_role)
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.speaking_rooms r WHERE r.id = _room_id AND r.host_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = _room_id AND m.user_id = auth.uid())
    )
  ORDER BY a.created_at DESC
  LIMIT 200
$$;

REVOKE EXECUTE ON FUNCTION public.room_activity(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.room_activity(uuid) TO authenticated;