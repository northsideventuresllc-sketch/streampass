-- Stream Pass registry on Northside Intelligence Brain
-- Revoke RPC access to trigger-only functions

REVOKE EXECUTE ON FUNCTION public.handle_streampass_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_streampass_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_service_last_active() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_service_last_active() FROM anon, authenticated;

COMMENT ON TABLE public.streampass_profiles IS 'Stream Pass (Sector 1B) — NI Brain project kxijunwgbrlfzvgkhklo';
COMMENT ON TABLE public.streampass_watchlist IS 'Stream Pass — universal cross-platform watchlist';
COMMENT ON TABLE public.streampass_user_services IS 'Stream Pass — subscription intelligence';
COMMENT ON TABLE public.streampass_tracked_titles IS 'Stream Pass — content passport alerts';
COMMENT ON TABLE public.streampass_watch_rooms IS 'Stream Pass — watch party rooms';
COMMENT ON TABLE public.streampass_room_members IS 'Stream Pass — watch party members';
COMMENT ON TABLE public.streampass_room_messages IS 'Stream Pass — realtime room chat';
