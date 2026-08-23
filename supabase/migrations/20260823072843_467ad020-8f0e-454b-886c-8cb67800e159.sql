ALTER TABLE public.room_members REPLICA IDENTITY FULL;
ALTER TABLE public.speaking_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.content_reports REPLICA IDENTITY FULL;
ALTER TABLE public.audit_log REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.speaking_rooms;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.content_reports;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;