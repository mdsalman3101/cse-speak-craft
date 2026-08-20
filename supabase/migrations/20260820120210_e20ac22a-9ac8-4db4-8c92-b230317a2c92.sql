ALTER TABLE public.session_registrations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.session_registrations
  DROP CONSTRAINT IF EXISTS session_registrations_status_check;
ALTER TABLE public.session_registrations
  ADD CONSTRAINT session_registrations_status_check
  CHECK (status IN ('pending','approved','rejected'));

DROP TRIGGER IF EXISTS session_registrations_touch ON public.session_registrations;
CREATE TRIGGER session_registrations_touch
  BEFORE UPDATE ON public.session_registrations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "own registrations" ON public.session_registrations;

CREATE POLICY "registrations read own" ON public.session_registrations
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "registrations request own" ON public.session_registrations
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL);

CREATE POLICY "registrations cancel own" ON public.session_registrations
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(),'mentor'::app_role) OR private.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "registrations staff review" ON public.session_registrations
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(),'mentor'::app_role) OR private.has_role(auth.uid(),'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(),'mentor'::app_role) OR private.has_role(auth.uid(),'admin'::app_role));

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
        WHERE r.session_id = s.id AND r.user_id = auth.uid() AND r.status = 'approved'
      )
    )
$$;
REVOKE ALL ON FUNCTION public.get_session_meeting_link(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_session_meeting_link(uuid) TO authenticated;
