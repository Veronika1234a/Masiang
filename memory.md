# MASIANG Memory

## Project Context

MASIANG adalah website pribadi/profesional untuk klien yang sering diundang ke sekolah sebagai pembicara, MC, trainer, atau pendamping pendidikan.

Tujuan aplikasi:

- Sekolah bisa daftar akun, login, mengelola profil, dan melakukan booking layanan.
- Admin/klien bisa melihat sekolah mana saja yang booking jasa, meninjau dokumen, memberi catatan, dan mengelola progres pendampingan.
- Saat ini aplikasi masih frontend-only, tanpa backend/API/database sungguhan.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Context untuk state management frontend-only

## Current Architecture

State utama aplikasi disimpan di React Context:

- `src/lib/AuthContext.tsx`
  Menangani login, logout, register, role user, dan daftar sekolah terdaftar.

- `src/lib/DashboardContext.tsx`
  Menangani data dashboard: bookings, documents, histories, profile, notifications, progress, toast, dan semua action admin/user.

- `src/lib/userDashboardData.ts`
  Seed data, type definitions, helper formatter, kategori layanan, tahapan, dan dokumen wajib.

Provider utama:

- `src/components/providers/AppProviders.tsx`

Route protection:

- `src/components/auth/AuthGuard.tsx`

## Main Routes

### Public

- `/`
- `/login`
- `/daftar-sekolah`

### User Dashboard

- `/dashboard/ringkasan`
- `/dashboard/booking-jadwal`
- `/dashboard/booking`
- `/dashboard/booking-baru`
- `/dashboard/booking/[bookingId]`
- `/dashboard/dokumen`
- `/dashboard/riwayat`
- `/dashboard/riwayat/[historyId]`
- `/dashboard/profil`

### Admin Dashboard

- `/dashboard-admin`
- `/dashboard-admin/booking`
- `/dashboard-admin/booking/[bookingId]`
- `/dashboard-admin/dokumen`
- `/dashboard-admin/sekolah`

## What Has Been Implemented

### 1. Auth and Registration

Implemented:

- Simulated login for admin and school
- Simulated school registration
- Role-based redirect after login
- Route guard for user dashboard and admin dashboard
- Logout from user and admin shell

Demo credentials:

- Admin: `admin@masiang.id` / `admin123`
- School seed account: `sdn1mappak@gmail.com` / `sekolah123`

Key files:

- `src/lib/AuthContext.tsx`
- `src/app/login/page.tsx`
- `src/app/daftar-sekolah/page.tsx`
- `src/components/auth/AuthGuard.tsx`

### 2. Shared Dashboard State

Implemented shared actions:

- `createBooking`
- `cancelBooking`
- `confirmBookingDone`
- `rateBooking`
- `uploadDocument`
- `deleteDocument`
- `replaceDocument`
- `toggleFollowUpItem`
- `markFollowUpDone`
- `updateProfile`
- `markNotificationRead`
- `markAllNotificationsRead`
- `approveBooking`
- `rejectBooking`
- `startSession`
- `reviewDocument`
- `addSupervisorNotes`

Important recent fixes:

- Saat booking ditandai selesai, riwayat baru sekarang dibuat dengan:
  - `supervisorNotes` dari booking
  - sinkronisasi dokumen booking ke `history.documents`
  - update `historyId` pada dokumen terkait

### 3. User Dashboard

Implemented:

- Ringkasan dashboard dengan progress tahapan
- Booking list dengan filter, sorting, pagination
- Booking calendar
- Booking creation form
- Booking detail page
- Document management
- Riwayat list
- Riwayat detail + follow-up checklist
- Profile management
- Notification bell + dropdown
- Toast system
- Modal system

Important user features:

- Kategori layanan sudah ditambahkan ke flow booking
- Cek bentrok jadwal saat booking baru
- Upload dokumen per tahap
- Revisi dokumen dengan validasi file type/size
- Rating dan feedback setelah sesi selesai
- Link ke riwayat spesifik setelah sesi selesai
- Empty state untuk dokumen riwayat kosong
- Filter kalender sudah mencakup `Ditolak` dan `Dibatalkan`

UI polish already done:

- Notification dropdown dashboard dirework
- Alert ringkasan diganti jadi panel compact "Perlu Perhatian"
- Quick actions di ringkasan diperbaiki
- Homepage `/` di-improve

Key files:

- `src/app/dashboard/ringkasan/page.tsx`
- `src/app/dashboard/booking/page.tsx`
- `src/app/dashboard/booking-baru/page.tsx`
- `src/app/dashboard/booking/[bookingId]/page.tsx`
- `src/app/dashboard/booking-jadwal/page.tsx`
- `src/app/dashboard/dokumen/page.tsx`
- `src/app/dashboard/riwayat/page.tsx`
- `src/app/dashboard/riwayat/[historyId]/page.tsx`
- `src/app/dashboard/profil/page.tsx`
- `src/components/dashboard/DashboardShell.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Toast.tsx`

### 4. Admin Dashboard

Implemented:

- Admin summary dashboard
- Booking management table
- Booking detail page for admin
- Document review page
- School list page
- Admin shell layout

Admin actions supported:

- Approve booking
- Reject booking with reason
- Start session
- Mark session as completed
- Add/edit supervisor notes
- Review document
- Mark document approved
- Request document revision with notes

Admin detail page includes:

- Booking info
- Timeline
- Related documents
- Supervisor notes
- Feedback/rating (if any)

Key files:

- `src/app/dashboard-admin/page.tsx`
- `src/app/dashboard-admin/booking/page.tsx`
- `src/app/dashboard-admin/booking/[bookingId]/page.tsx`
- `src/app/dashboard-admin/dokumen/page.tsx`
- `src/app/dashboard-admin/sekolah/page.tsx`
- `src/components/admin/AdminShell.tsx`

## Important Design Notes

- User dashboard and admin dashboard both use shared app state from React Context.
- Styling mostly uses Tailwind utility classes, with some CSS Modules on layout shells and marketing pages.
- Current design language:
  - heading color: `#25365f`
  - secondary text: `#6d7998`
  - border: `#e1dce8`
  - action/link blue: `#4a6baf`
  - gold CTA accent: `#d2ac50`

## Known Gaps / Limitations

These are still important and not fully solved:

### A. No Real Persistence

- Auth state is still in-memory.
- Registered schools reset on full refresh.
- Dashboard state also resets on refresh.

Meaning:

- Login session is not persistent.
- Register/login is still demo-only.

### B. Data Is Not Yet Scoped Per Logged-In School

This is the biggest remaining logic gap.

Current issue:

- `DashboardContext` still uses one shared `profile`, `bookings`, `documents`, `histories`, and `notifications`.
- New schools can register and login, but they do not yet get a fully separate dataset.
- `createBooking()` still uses the current shared `profile.schoolName`, not a real school-specific data store keyed by `schoolId`.

Impact:

- Good enough for demo frontend flow.
- Not yet correct for real multi-school usage.

### C. School Identity Matching Still Uses School Name

Admin school aggregation currently still depends heavily on `schoolName`.

Better future direction:

- use `schoolId` everywhere
- store bookings/documents/histories keyed by `schoolId`
- derive school-specific dashboard data from active logged-in user

### D. File Handling Is Simulated

- No real upload storage
- No real preview/download for file contents
- No backend/API validation

### E. Login/Register Pages Still Demo-Oriented

- Demo credentials are visible on login page
- No redirect guard yet for already-authenticated user on login/register page
- No forgot password / remember me / session restore

## Recommended Next Priorities

If continuing development, this should be the next order:

1. Persist auth and registered schools to `localStorage`
2. Refactor dashboard state to be per-school, not shared globally
3. Introduce `schoolId` relationships in booking/document/history models
4. Sync login user with dashboard profile automatically
5. Add redirect guard on login/register if already authenticated
6. Add real backend or Supabase integration

## Quick Mental Model

Right now the project is best understood as:

- a strong frontend prototype
- complete enough for user/admin flow demo
- visually polished
- functionally rich
- but not yet production-correct for multi-user, multi-school persistence

## Last Major Work Included

- User dashboard logic implementation
- Admin dashboard full logic implementation
- Login and register pages
- Notification redesign
- Ringkasan UX polish
- Homepage layout improvement
- Admin booking detail page
- Route protection
- History/document sync on booking completion
- Minor UX fixes across dashboard pages
