# APP ROUTER MEMORY

## Overview
All routes live under `src/app/` following Next.js 16 App Router conventions. Two protected areas (`/dashboard/**`, `/dashboard-admin/**`) are guarded by both middleware (`src/middleware.ts`) and `AuthGuard` in their respective layout files.

## Route Hierarchy

```
/                              Public landing page (static)
/login                         Public auth entry
/daftar-sekolah                Public school registration
/dashboard                     → redirect to /dashboard/ringkasan
/dashboard/ringkasan           School summary (KPI, progress, attention panel)
/dashboard/booking             School booking list (filter, sort, paginate)
/dashboard/booking/[bookingId] School booking detail (timeline, docs, rating)
/dashboard/booking-baru        New booking creation
/dashboard/booking-jadwal      Calendar view of bookings
/dashboard/dokumen             Document upload + review status
/dashboard/riwayat             History list
/dashboard/riwayat/[historyId] History detail + follow-up checklist
/dashboard/profil              School profile view/edit
/dashboard-admin               Admin summary (stats, pending, docs needing review)
/dashboard-admin/booking       Booking management (approve/reject/start/complete)
/dashboard-admin/booking/[bookingId] Admin booking detail
/dashboard-admin/dokumen       Document review (approve/revise)
/dashboard-admin/sekolah       School list with per-school stats + detail modal
/dashboard-admin/detail-dokumen Document detail view (seed/static)
/dashboard-admin/semua-dokumen All documents view (seed/static)
```

## Layout Chain

| Route | Nearest Layout | Shell | Guards |
|-------|---------------|-------|--------|
| `/`, `/login`, `/daftar-sekolah` | `src/app/layout.tsx` | None | None |
| `/dashboard/**` | `src/app/dashboard/layout.tsx` | `DashboardShell` | Middleware + `AuthGuard(requiredRole="school")` |
| `/dashboard-admin/**` | `src/app/dashboard-admin/layout.tsx` | `AdminShell` | Middleware + `AuthGuard(requiredRole="admin")` |

## Middleware Behavior

- `src/middleware.ts` delegates to `src/lib/supabase/middleware.ts:updateSession`.
- Refreshes Supabase session cookies on every request.
- For `/dashboard/**` and `/dashboard-admin/**`:
  - No user → redirect to `/login` with `?redirectTo=` parameter.
  - Wrong role → redirect to correct dashboard or `/login`.
  - `E2E_TEST_MODE=1` or `masiang-e2e-bypass` cookie → bypass auth check.
- Public routes pass through without redirect.

## Auth Flow

1. Registration at `/daftar-sekolah` → `useAuth().register()` → Supabase `signUp` with metadata → DB trigger creates `profiles` row.
2. Login at `/login` → `useAuth().login()` → Supabase `signInWithPassword` → `AuthContext` fetches profile → resolves role → redirects via `resolvePostLoginRedirect`.
3. Post-login redirect: school → `/dashboard/ringkasan`, admin → `/dashboard-admin`.
4. Logout → `useAuth().logout()` → Supabase `signOut` → `window.location.replace("/login")`.

## Data Flow Per Route

All dashboard routes consume `useDashboard()` from `DashboardContext`, which loads data from Supabase on mount. The context owns:
- `bookings` (BookingItem[])
- `documents` (SchoolDocument[])
- `histories` (RiwayatItem[])
- `profile` (SchoolProfile)
- `notifications` (Notification[])
- `toasts` (ToastItem[])
- Actions: `createBooking`, `cancelBooking`, `approveBooking`, `rejectBooking`, `startSession`, `confirmBookingDone`, `rateBooking`, `uploadDocument`, `deleteDocument`, `replaceDocument`, `reviewDocument`, `updateProfile`, `addSupervisorNotes`, `markNotificationRead`, `markAllNotificationsRead`, `addToast`, `removeToast`.

## Seed Data

- `src/lib/userDashboardData.ts` exports seed functions: `getBookingSeed()`, `getRiwayatSeed()`, `getUserDocumentSeed()`, `getSchoolProfile()`, `getNotificationSeed()`.
- `src/app/api/seed-documents/` provides static document downloads for seed DOC-004 and DOC-005.

## Conventions
- Dynamic routes use `[bookingId]` and `[historyId]` params.
- All dashboard pages are client components (`"use client"`).
- Landing page is a server component (no `"use client"`).
- Login and registration pages wrap `useSearchParams` in `Suspense`.
