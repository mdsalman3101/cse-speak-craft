
REVOKE ALL ON FUNCTION public.audit_posts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_replies() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_reports() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_room_members() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_rooms() FROM PUBLIC, anon, authenticated;
