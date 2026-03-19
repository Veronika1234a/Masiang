-- Fix notifications insert RLS for admin action flows.
-- Admin should be able to insert notifications for any target user.

drop policy if exists "Allow insert notifications for own user" on public.notifications;
drop policy if exists "Admin can insert any notifications" on public.notifications;
drop policy if exists "notifications_insert_own_user" on public.notifications;
drop policy if exists "notifications_insert_admin_any_user" on public.notifications;
drop policy if exists "notifications_insert_own_or_admin" on public.notifications;

create policy "notifications_insert_own_or_admin"
  on public.notifications for insert
  with check (
    user_id = auth.uid() or public.is_admin()
  );
