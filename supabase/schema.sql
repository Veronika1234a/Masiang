-- ============================================================
-- MASIANG Site – Full Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 0. HELPER: Admin check function (SECURITY DEFINER to avoid RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'school' check (role in ('school', 'admin')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  school_name   text,
  npsn          text unique,
  contact_name  text,
  email         text not null,
  phone         text,
  address       text,
  education_level text,
  principal_name text,
  operator_name text,
  district      text,
  avatar_path   text,
  approval_reviewed_at timestamptz,
  approval_reviewed_by uuid references auth.users(id) on delete set null,
  approval_rejection_reason text,
  created_at    timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists approval_status text not null default 'pending';
alter table public.profiles add column if not exists approval_reviewed_at timestamptz;
alter table public.profiles add column if not exists approval_reviewed_by uuid references auth.users(id) on delete set null;
alter table public.profiles add column if not exists approval_rejection_reason text;
update public.profiles
set approval_status = case
  when role = 'admin' then 'approved'
  when approval_status is null then 'approved'
  else approval_status
end;

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admin can read all profiles"
  on public.profiles for select
  using (
    public.is_admin()
  );

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

create policy "Admin can update all profiles"
  on public.profiles for update
  using (
    public.is_admin()
  )
  with check (
    public.is_admin()
  );

create policy "Allow insert for own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

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

create or replace function public.normalize_booking_session_text(input text)
returns text
language sql
immutable
as $$
  with digits as (
    select regexp_replace(coalesce(input, ''), '[^0-9]', '', 'g') as d
  )
  select case
    when length(d) >= 8 then
      substring(d from 1 for 2) || '.' || substring(d from 3 for 2)
      || ' - ' || substring(d from 5 for 2) || '.' || substring(d from 7 for 2) || ' WITA'
    else trim(coalesce(input, ''))
  end
  from digits;
$$;

-- 2. BOOKINGS
create table if not exists public.bookings (
  id               text primary key,
  school_id        uuid not null references public.profiles(id) on delete cascade,
  school_name      text not null,
  topic            text not null,
  category         text,
  date_iso         date not null,
  session          text not null,
  session_key      text generated always as (public.normalize_booking_session_text(session)) stored,
  status           text not null default 'Menunggu',
  timeline         jsonb not null default '[]'::jsonb,
  goal             text,
  notes            text,
  cancel_reason    text,
  rating           int,
  feedback         text,
  supervisor_notes text,
  created_at       timestamptz not null default now()
);

alter table public.bookings
  add column if not exists session_key text generated always as (public.normalize_booking_session_text(session)) stored;

alter table public.bookings enable row level security;

drop index if exists public.bookings_active_slot_unique;
create unique index bookings_active_slot_unique
  on public.bookings (date_iso, session_key)
  where status not in ('Dibatalkan', 'Ditolak');

alter table public.bookings
  drop constraint if exists bookings_session_key_format;
alter table public.bookings
  add constraint bookings_session_key_format
  check (session_key ~ '^[0-2][0-9]\.[0-5][0-9] - [0-2][0-9]\.[0-5][0-9] WITA$');

create policy "Schools can read own bookings"
  on public.bookings for select
  using (school_id = auth.uid());

create policy "Admin can read all bookings"
  on public.bookings for select
  using (
    public.is_admin()
  );

create policy "Schools can insert own bookings"
  on public.bookings for insert
  with check (school_id = auth.uid());

create policy "Schools can update own bookings"
  on public.bookings for update
  using (school_id = auth.uid())
  with check (school_id = auth.uid());

create policy "Admin can update all bookings"
  on public.bookings for update
  using (
    public.is_admin()
  );

-- 3. DOCUMENTS
create table if not exists public.documents (
  id              text primary key,
  school_id       uuid not null references public.profiles(id) on delete cascade,
  booking_id      text references public.bookings(id) on delete set null,
  history_id      text,
  file_name       text not null,
  storage_path    text,
  file_size       bigint,
  mime_type       text,
  stage           text not null,
  review_status   text default 'Menunggu Review',
  reviewer_notes  text,
  version         int default 1,
  parent_doc_id   text,
  uploaded_at     text not null,
  uploaded_at_ts  timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

alter table public.documents
  add column if not exists uploaded_at_ts timestamptz not null default now();

create index if not exists documents_parent_doc_idx
  on public.documents (parent_doc_id);

alter table public.documents
  drop constraint if exists documents_parent_doc_fk;
alter table public.documents
  add constraint documents_parent_doc_fk
  foreign key (parent_doc_id)
  references public.documents(id)
  on delete set null
  not valid;

alter table public.documents enable row level security;

create policy "Schools can read own documents"
  on public.documents for select
  using (school_id = auth.uid());

create policy "Admin can read all documents"
  on public.documents for select
  using (
    public.is_admin()
  );

create policy "Schools can insert own documents"
  on public.documents for insert
  with check (school_id = auth.uid());

create policy "Schools can update own documents"
  on public.documents for update
  using (school_id = auth.uid())
  with check (school_id = auth.uid());

create policy "Schools can delete own documents"
  on public.documents for delete
  using (school_id = auth.uid());

create policy "Admin can update all documents"
  on public.documents for update
  using (
    public.is_admin()
  );

-- 4. HISTORIES
create table if not exists public.histories (
  id               text primary key,
  school_id        uuid not null references public.profiles(id) on delete cascade,
  booking_id       text references public.bookings(id) on delete set null,
  date_iso         date not null,
  school_name      text not null,
  session          text not null,
  title            text not null,
  description      text not null,
  status           text not null default 'Tindak Lanjut',
  follow_up_iso    date,
  supervisor_notes text,
  follow_up_done   boolean not null default false,
  follow_up_items  jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

alter table public.histories enable row level security;

create unique index if not exists histories_booking_id_unique
  on public.histories (booking_id)
  where booking_id is not null;

create policy "Schools can read own histories"
  on public.histories for select
  using (school_id = auth.uid());

create policy "Admin can read all histories"
  on public.histories for select
  using (
    public.is_admin()
  );

create policy "Schools can update own histories"
  on public.histories for update
  using (school_id = auth.uid())
  with check (school_id = auth.uid());

create policy "Admin can update all histories"
  on public.histories for update
  using (
    public.is_admin()
  );

create policy "Allow insert for own histories"
  on public.histories for insert
  with check (school_id = auth.uid());

create policy "Admin can insert histories"
  on public.histories for insert
  with check (
    public.is_admin()
  );

-- 5. NOTIFICATIONS
create table if not exists public.notifications (
  id              text primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  message         text not null,
  type            text not null,
  reference_id    text,
  reference_type  text,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Allow insert notifications for own user"
  on public.notifications for insert
  with check (user_id = auth.uid());

create policy "Admin can insert any notifications"
  on public.notifications for insert
  with check (
    public.is_admin()
  );

-- 6. AUTO-CREATE PROFILE ON SIGNUP
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. SEQUENCES FOR READABLE IDS
create sequence if not exists public.booking_id_seq start with 100;
create sequence if not exists public.doc_id_seq start with 100;
create sequence if not exists public.history_id_seq start with 100;
create sequence if not exists public.notif_id_seq start with 100;

-- Helper functions to generate readable IDs
create or replace function public.next_booking_id()
returns text language sql as $$
  select 'BK-' || lpad(nextval('public.booking_id_seq')::text, 3, '0');
$$;

create or replace function public.next_doc_id()
returns text language sql as $$
  select 'DOC-' || lpad(nextval('public.doc_id_seq')::text, 3, '0');
$$;

create or replace function public.next_history_id()
returns text language sql as $$
  select 'RH-' || lpad(nextval('public.history_id_seq')::text, 3, '0');
$$;

create or replace function public.next_notif_id()
returns text language sql as $$
  select 'NTF-' || lpad(nextval('public.notif_id_seq')::text, 3, '0');
$$;

-- 8. ADMIN NOTIFICATION HELPERS
create or replace function public.insert_admin_notification(
  p_title text,
  p_message text,
  p_type text,
  p_reference_id text default null,
  p_reference_type text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    id,
    user_id,
    title,
    message,
    type,
    reference_id,
    reference_type
  )
  select
    public.next_notif_id(),
    profiles.id,
    p_title,
    p_message,
    p_type,
    p_reference_id,
    p_reference_type
  from public.profiles
  where profiles.role = 'admin';
end;
$$;

create or replace function public.notify_admins_on_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.insert_admin_notification(
    'Booking Baru',
    format('Booking %s (%s) diajukan oleh %s.', new.id, new.topic, new.school_name),
    'booking_created',
    new.id,
    'booking'
  );

  return new;
end;
$$;

create or replace function public.notify_admins_on_booking_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'Dibatalkan' and old.status is distinct from new.status then
    perform public.insert_admin_notification(
      'Booking Dibatalkan',
      format('Booking %s dibatalkan oleh %s.', new.id, new.school_name),
      'booking_cancelled',
      new.id,
      'booking'
    );
  end if;

  return new;
end;
$$;

create or replace function public.notify_admins_on_document_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_school_name text;
begin
  select profiles.school_name
    into v_school_name
  from public.profiles
  where profiles.id = new.school_id;

  perform public.insert_admin_notification(
    'Dokumen Diunggah',
    format(
      'Dokumen "%s" diunggah oleh %s.',
      new.file_name,
      coalesce(v_school_name, 'sekolah')
    ),
    'doc_uploaded',
    new.id,
    'document'
  );

  return new;
end;
$$;

drop trigger if exists on_booking_created_notify_admins on public.bookings;
create trigger on_booking_created_notify_admins
  after insert on public.bookings
  for each row execute procedure public.notify_admins_on_booking_insert();

drop trigger if exists on_booking_cancelled_notify_admins on public.bookings;
create trigger on_booking_cancelled_notify_admins
  after update of status on public.bookings
  for each row execute procedure public.notify_admins_on_booking_cancel();

drop trigger if exists on_document_created_notify_admins on public.documents;
create trigger on_document_created_notify_admins
  after insert on public.documents
  for each row execute procedure public.notify_admins_on_document_insert();

-- 9. STORAGE BUCKET
insert into storage.buckets (id, name, public) 
values ('school-documents', 'school-documents', false)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "Schools upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'school-documents' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Schools read own files"
  on storage.objects for select
  using (
    bucket_id = 'school-documents' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Schools delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'school-documents' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admin can read all storage"
  on storage.objects for select
  using (
    bucket_id = 'school-documents' 
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );
