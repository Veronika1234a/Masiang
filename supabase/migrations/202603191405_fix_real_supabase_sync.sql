-- Real Supabase sync migration for staging environment.
-- Safe to run multiple times.

-- 1) Normalize booking session and enforce unique active slot.
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

alter table public.bookings
  add column if not exists session_key text
  generated always as (public.normalize_booking_session_text(session)) stored;

-- Resolve existing active slot duplicates before creating unique index.
with ranked as (
  select
    id,
    row_number() over (
      partition by date_iso, public.normalize_booking_session_text(session)
      order by created_at, id
    ) as rn
  from public.bookings
  where status not in ('Dibatalkan', 'Ditolak')
)
update public.bookings b
set
  status = 'Ditolak',
  cancel_reason = coalesce(
    b.cancel_reason,
    'Auto-reject migration: duplicate active slot'
  )
from ranked r
where b.id = r.id
  and r.rn > 1;

drop index if exists public.bookings_active_slot_unique;
create unique index if not exists bookings_active_slot_unique
  on public.bookings (date_iso, session_key)
  where status not in ('Dibatalkan', 'Ditolak');

alter table public.bookings
  drop constraint if exists bookings_session_key_format;
alter table public.bookings
  add constraint bookings_session_key_format
  check (session_key ~ '^[0-2][0-9]\.[0-5][0-9] - [0-2][0-9]\.[0-5][0-9] WITA$');

-- 2) Notifications policy alignment.
drop policy if exists "Allow insert notifications for own user" on public.notifications;
drop policy if exists "Admin can insert any notifications" on public.notifications;
drop policy if exists "notifications_insert_own_user" on public.notifications;
drop policy if exists "notifications_insert_admin_any_user" on public.notifications;

create policy "notifications_insert_own_user"
  on public.notifications for insert
  with check (user_id = auth.uid());

create policy "notifications_insert_admin_any_user"
  on public.notifications for insert
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 3) Notification helpers and triggers.
create sequence if not exists public.notif_id_seq start with 100;

create or replace function public.next_notif_id()
returns text
language sql
as $$
  select 'NTF-' || lpad(nextval('public.notif_id_seq')::text, 3, '0');
$$;

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
