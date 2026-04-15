-- Fast auth claims + profile hardening.
-- Run after the register/login hardening migration.

create or replace function public.profile_auth_fields_unchanged(
  target_user_id uuid,
  next_role text,
  next_approval_status text,
  next_approval_reviewed_at timestamptz,
  next_approval_reviewed_by uuid,
  next_approval_rejection_reason text
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role = next_role
      and approval_status = next_approval_status
      and approval_reviewed_at is not distinct from next_approval_reviewed_at
      and approval_reviewed_by is not distinct from next_approval_reviewed_by
      and approval_rejection_reason is not distinct from next_approval_rejection_reason
  );
$$;

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own editable profile fields" on public.profiles;
create policy "Users can update own editable profile fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and public.profile_auth_fields_unchanged(
      id,
      role,
      approval_status,
      approval_reviewed_at,
      approval_reviewed_by,
      approval_rejection_reason
    )
  );

create or replace function public.sync_profile_auth_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'role', new.role,
      'approval_status', case
        when new.role = 'admin' then 'approved'
        else coalesce(new.approval_status, 'pending')
      end
    )
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_profile_sync_auth_app_metadata on public.profiles;
create trigger on_profile_sync_auth_app_metadata
  after insert or update of role, approval_status on public.profiles
  for each row execute procedure public.sync_profile_auth_app_metadata();

update auth.users
set raw_app_meta_data =
  coalesce(auth.users.raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'role', profiles.role,
    'approval_status', case
      when profiles.role = 'admin' then 'approved'
      else coalesce(profiles.approval_status, 'pending')
    end
  )
from public.profiles
where auth.users.id = profiles.id;
