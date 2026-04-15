alter table public.profiles
  add column if not exists approval_reviewed_at timestamptz,
  add column if not exists approval_reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists approval_rejection_reason text;

create table if not exists public.registration_rate_limits (
  id bigserial primary key,
  ip_address text not null,
  email text not null,
  npsn text not null,
  created_at timestamptz not null default now()
);

create index if not exists registration_rate_limits_created_at_idx
  on public.registration_rate_limits (created_at);

create index if not exists registration_rate_limits_ip_created_at_idx
  on public.registration_rate_limits (ip_address, created_at);

create index if not exists registration_rate_limits_email_created_at_idx
  on public.registration_rate_limits (email, created_at);

create index if not exists registration_rate_limits_npsn_created_at_idx
  on public.registration_rate_limits (npsn, created_at);

alter table public.registration_rate_limits enable row level security;

drop policy if exists "No direct registration rate limit access" on public.registration_rate_limits;
create policy "No direct registration rate limit access"
  on public.registration_rate_limits
  for all
  using (false)
  with check (false);
