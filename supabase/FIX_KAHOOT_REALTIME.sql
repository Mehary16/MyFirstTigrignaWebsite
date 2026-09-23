-- Enable Supabase Realtime for live Kahoot tables (run after FIX_KAHOOT_LIVE.sql).
-- Dashboard: Database → Publications → supabase_realtime should list these tables.

do $$
begin
  alter publication supabase_realtime add table public.kahoot_live_sessions;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.kahoot_live_players;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.kahoot_live_answers;
exception
  when duplicate_object then null;
end $$;
