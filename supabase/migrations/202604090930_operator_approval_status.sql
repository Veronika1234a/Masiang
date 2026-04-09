alter table public.profiles
  add column if not exists approval_status text not null default 'pending';

alter table public.profiles
  drop constraint if exists profiles_approval_status_check;

alter table public.profiles
  add constraint profiles_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));

update public.profiles
set approval_status = case
  when role = 'admin' then 'approved'
  when approval_status is null then 'approved'
  else approval_status
end;

drop policy if exists "Admin can update all profiles" on public.profiles;
create policy "Admin can update all profiles"
  on public.profiles for update
  using (
    public.is_admin()
  )
  with check (
    public.is_admin()
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id, role, approval_status, school_name, npsn, contact_name, email, phone, address, avatar_path
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'school'),
    case
      when coalesce(new.raw_user_meta_data ->> 'role', 'school') = 'admin' then 'approved'
      else coalesce(new.raw_user_meta_data ->> 'approval_status', 'pending')
    end,
    new.raw_user_meta_data ->> 'school_name',
    new.raw_user_meta_data ->> 'npsn',
    new.raw_user_meta_data ->> 'contact_name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'address',
    new.raw_user_meta_data ->> 'avatar_path'
  );
  return new;
end;
$$;
