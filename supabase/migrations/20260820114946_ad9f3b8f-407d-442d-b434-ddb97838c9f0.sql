
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  category text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read audit log"
ON public.audit_log FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'mentor') OR private.has_role(auth.uid(), 'admin'));

CREATE INDEX audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX audit_log_category_idx ON public.audit_log (category);

CREATE OR REPLACE FUNCTION private.write_audit(
  _action text, _category text, _target_type text, _target_id uuid, _summary text, _details jsonb
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.audit_log (actor_id, action, category, target_type, target_id, summary, details)
  VALUES (auth.uid(), _action, _category, _target_type, _target_id, _summary, COALESCE(_details, '{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.audit_posts() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM private.write_audit('post_deleted','moderation','post',OLD.id,'Deleted post: '||OLD.title,
      jsonb_build_object('author_id',OLD.user_id,'category',OLD.category));
    RETURN OLD;
  ELSIF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden THEN
    PERFORM private.write_audit(CASE WHEN NEW.is_hidden THEN 'post_hidden' ELSE 'post_unhidden' END,
      'moderation','post',NEW.id,
      (CASE WHEN NEW.is_hidden THEN 'Hid post: ' ELSE 'Unhid post: ' END)||NEW.title,
      jsonb_build_object('author_id',NEW.user_id,'from',OLD.is_hidden,'to',NEW.is_hidden));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER audit_posts_trg AFTER UPDATE OR DELETE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.audit_posts();

CREATE OR REPLACE FUNCTION public.audit_replies() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM private.write_audit('reply_deleted','moderation','reply',OLD.id,'Deleted a reply',
      jsonb_build_object('author_id',OLD.user_id,'post_id',OLD.post_id));
    RETURN OLD;
  ELSIF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden THEN
    PERFORM private.write_audit(CASE WHEN NEW.is_hidden THEN 'reply_hidden' ELSE 'reply_unhidden' END,
      'moderation','reply',NEW.id,
      CASE WHEN NEW.is_hidden THEN 'Hid a reply' ELSE 'Unhid a reply' END,
      jsonb_build_object('author_id',NEW.user_id,'post_id',NEW.post_id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER audit_replies_trg AFTER UPDATE OR DELETE ON public.community_replies
FOR EACH ROW EXECUTE FUNCTION public.audit_replies();

CREATE OR REPLACE FUNCTION public.audit_reports() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM private.write_audit('report_created','report',NEW.target_type,NEW.target_id,
      'Report filed: '||NEW.reason, jsonb_build_object('report_id',NEW.id,'status',NEW.status));
    RETURN NEW;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM private.write_audit('report_'||NEW.status,'report',NEW.target_type,NEW.target_id,
      'Report '||NEW.status||': '||NEW.reason,
      jsonb_build_object('report_id',NEW.id,'from',OLD.status,'to',NEW.status));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER audit_reports_trg AFTER INSERT OR UPDATE ON public.content_reports
FOR EACH ROW EXECUTE FUNCTION public.audit_reports();

CREATE OR REPLACE FUNCTION public.audit_room_members() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; uid uuid; rid uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN uid := NEW.user_id; rid := NEW.room_id; ELSE uid := OLD.user_id; rid := OLD.room_id; END IF;
  SELECT title INTO r FROM public.speaking_rooms WHERE id = rid;
  PERFORM private.write_audit(CASE WHEN TG_OP='INSERT' THEN 'room_joined' ELSE 'room_left' END,
    'membership','room',rid,
    (CASE WHEN TG_OP='INSERT' THEN 'Joined room: ' ELSE 'Left room: ' END)||COALESCE(r.title,'(deleted room)'),
    jsonb_build_object('member_id',uid));
  IF TG_OP = 'INSERT' THEN RETURN NEW; ELSE RETURN OLD; END IF;
END; $$;

CREATE TRIGGER audit_room_members_trg AFTER INSERT OR DELETE ON public.room_members
FOR EACH ROW EXECUTE FUNCTION public.audit_room_members();

CREATE OR REPLACE FUNCTION public.audit_rooms() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM private.write_audit('room_'||NEW.status,'membership','room',NEW.id,
      'Room '||NEW.title||' marked '||NEW.status,
      jsonb_build_object('from',OLD.status,'to',NEW.status,'host_id',NEW.host_id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER audit_rooms_trg AFTER UPDATE ON public.speaking_rooms
FOR EACH ROW EXECUTE FUNCTION public.audit_rooms();
