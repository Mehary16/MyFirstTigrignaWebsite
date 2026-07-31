-- Optional audit log table for enterprise activity history.
-- Run in Supabase SQL Editor.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit logs read teacher" on public.audit_logs;
create policy "audit logs read teacher"
  on public.audit_logs for select
  using (public.is_teacher());

-- Inserts are performed with the Supabase service role (bypasses RLS).
