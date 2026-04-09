# MASIANG — PROJECT KNOWLEDGE BASE

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Supabase
**Purpose:** Platform pendampingan pendidikan — menghubungkan sekolah dengan pengawas/admin untuk booking, dokumen, dan riwayat sesi.

## Structure

```text
masiang-site/
├── src/
│   ├── app/                        Next.js App Router — all routes
│   │   ├── layout.tsx              Root layout: fonts (Fraunces + Plus Jakarta Sans), AppProviders
│   │   ├── page.tsx                Landing page (hero, steps, about, CTA, footer)
│   │   ├── globals.css             Tailwind import + CSS custom properties
│   │   ├── login/page.tsx          Login form with email verification resend
│   │   ├── daftar-sekolah/page.tsx School registration form
│   │   ├── dashboard/              School dashboard routes (protected by middleware + AuthGuard)
│   │   │   ├── layout.tsx          School shell: DashboardShell + AuthGuard requiredRole="school"
│   │   │   ├── page.tsx            → redirect to /dashboard/ringkasan
│   │   │   ├── ringkasan/          Summary: KPI, progress, next booking, attention panel
│   │   │   ├── booking/            Booking list with filter, sort, pagination
│   │   │   ├── booking/[bookingId]/ Booking detail with timeline, docs, rating
│   │   │   ├── booking-baru/       New booking creation form
│   │   │   ├── booking-jadwal/     Calendar view of bookings
│   │   │   ├── dokumen/            Document upload, list, review status
│   │   │   ├── riwayat/            History list
│   │   │   ├── riwayat/[historyId]/ History detail + follow-up checklist
│   │   │   └── profil/             School profile view/edit
│   │   └── dashboard-admin/        Admin dashboard routes (protected by middleware + AuthGuard)
│   │       ├── layout.tsx          Admin shell: AdminShell + AuthGuard requiredRole="admin"
│   │       ├── page.tsx            Admin summary: stats, pending bookings, docs needing review
│   │       ├── booking/            Booking management table with approve/reject/start/complete
│   │       ├── booking/[bookingId]/ Booking detail for admin
│   │       ├── dokumen/            Document review (approve/revise)
│   │       ├── sekolah/            School list with per-school stats and detail modal
│   │       ├── detail-dokumen/     Document detail view
│   │       └── semua-dokumen/      All documents view
│   ├── components/
│   │   ├── ui/                     Primitives: Button, Modal, Toast
│   │   ├── layout/                 MarketingHeader, MarketingFooter
│   │   ├── dashboard/              DashboardShell, DashboardDataState
│   │   ├── admin/                  AdminShell
│   │   ├── auth/                   AuthGuard (role-based route protection)
│   │   └── providers/              AppProviders (wraps AuthProvider + DashboardProvider)
│   ├── lib/
│   │   ├── AuthContext.tsx         Auth state: login, register, logout, role, registeredSchools
│   │   ├── DashboardContext.tsx    Central data: bookings, docs, histories, profile, notifications, toasts
│   │   ├── userDashboardData.ts    Domain types, constants, utilities, seed data
│   │   ├── userFlow.ts             Redirect helpers, notification routing, school document matching
│   │   ├── middleware.ts           Next.js middleware → Supabase session refresh + role guard
│   │   └── supabase/
│   │       ├── client.ts           Browser Supabase client factory
│   │       ├── server.ts           Server Supabase client with cookie bridging
│   │       ├── middleware.ts       Session refresh for Next.js middleware
│   │       ├── types.ts            Generated Database types from Supabase
│   │       └── services/           Domain services: auth, profiles, bookings, documents, histories, notifications, storage
│   └── middleware.ts               Re-exports updateSession from lib/supabase/middleware
├── public/assets/masiang/          Local visual assets (SVGs, images)
├── supabase/schema.sql             Full DB schema: tables, RLS, triggers, sequences, storage
├── docs/                           Product scope, implementation memory, UI guidelines
├── memory.md                       Long-form historical implementation memory
├── package.json                    Scripts: dev, build, start, lint
├── tsconfig.json                   Strict TS, @/* path alias, Next.js plugin
├── eslint.config.mjs               Next.js core-web-vitals + TypeScript
├── next.config.ts                  reactCompiler: true
├── postcss.config.mjs              @tailwindcss/postcss
└── playwright.config.ts            E2E config pointing to ./tests (no tests directory yet)
```

## Route Map

| Route | File | Access | Shell/Layout | Key Data Consumed |
|-------|------|--------|-------------|-------------------|
| `/` | `src/app/page.tsx` | Public | Root layout | None (static landing) |
| `/login` | `src/app/login/page.tsx` | Public | Root layout | `useAuth()` → login, resendSignupVerification |
| `/daftar-sekolah` | `src/app/daftar-sekolah/page.tsx` | Public | Root layout | `useAuth()` → register |
| `/dashboard` | `src/app/dashboard/page.tsx` | School | Dashboard layout → DashboardShell | Redirects to `/dashboard/ringkasan` |
| `/dashboard/ringkasan` | `src/app/dashboard/ringkasan/page.tsx` | School | DashboardShell | `useDashboard()` → bookings, documents, histories, profile, progress, unreadCount; `useAuth()` → user |
| `/dashboard/booking` | `src/app/dashboard/booking/page.tsx` | School | DashboardShell | `useDashboard()` → bookings |
| `/dashboard/booking/[bookingId]` | `src/app/dashboard/booking/[bookingId]/page.tsx` | School | DashboardShell | `useDashboard()` → bookings, documents, confirmBookingDone |
| `/dashboard/booking-baru` | `src/app/dashboard/booking-baru/page.tsx` | School | DashboardShell | `useDashboard()` → createBooking, checkAvailability |
| `/dashboard/booking-jadwal` | `src/app/dashboard/booking-jadwal/page.tsx` | School | DashboardShell | `useDashboard()` → bookings |
| `/dashboard/dokumen` | `src/app/dashboard/dokumen/page.tsx` | School | DashboardShell | `useDashboard()` → documents, uploadDocument, deleteDocument, replaceDocument |
| `/dashboard/riwayat` | `src/app/dashboard/riwayat/page.tsx` | School | DashboardShell | `useDashboard()` → histories |
| `/dashboard/riwayat/[historyId]` | `src/app/dashboard/riwayat/[historyId]/page.tsx` | School | DashboardShell | `useDashboard()` → histories |
| `/dashboard/profil` | `src/app/dashboard/profil/page.tsx` | School | DashboardShell | `useDashboard()` → profile, updateProfile |
| `/dashboard-admin` | `src/app/dashboard-admin/page.tsx` | Admin | AdminShell | `useDashboard()` → bookings, documents, histories |
| `/dashboard-admin/booking` | `src/app/dashboard-admin/booking/page.tsx` | Admin | AdminShell | `useDashboard()` → bookings, approveBooking, rejectBooking, startSession, confirmBookingDone, addSupervisorNotes |
| `/dashboard-admin/booking/[bookingId]` | `src/app/dashboard-admin/booking/[bookingId]/page.tsx` | Admin | AdminShell | `useDashboard()` → bookings, documents, approveBooking, rejectBooking, startSession, confirmBookingDone, addSupervisorNotes |
| `/dashboard-admin/dokumen` | `src/app/dashboard-admin/dokumen/page.tsx` | Admin | AdminShell | `useDashboard()` → documents, reviewDocument |
| `/dashboard-admin/sekolah` | `src/app/dashboard-admin/sekolah/page.tsx` | Admin | AdminShell | `useDashboard()` → bookings, documents, histories; `useAuth()` → registeredSchools |
| `/dashboard-admin/detail-dokumen` | `src/app/dashboard-admin/detail-dokumen/page.tsx` | Admin | AdminShell | Static/seed document view |
| `/dashboard-admin/semua-dokumen` | `src/app/dashboard-admin/semua-dokumen/page.tsx` | Admin | AdminShell | Static seed documents |

## Where To Look

| Task | Location | Notes |
|------|----------|-------|
| App bootstrap | `src/app/layout.tsx`, `src/components/providers/AppProviders.tsx` | Fonts + AuthProvider wrapping DashboardProvider |
| Public pages | `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/daftar-sekolah/page.tsx` | Marketing, auth entry, registration |
| School dashboard | `src/app/dashboard/**/*`, `src/components/dashboard/DashboardShell.tsx` | All school-facing flows |
| Admin dashboard | `src/app/dashboard-admin/**/*`, `src/components/admin/AdminShell.tsx` | All admin-facing flows |
| Auth/session | `src/lib/AuthContext.tsx`, `src/components/auth/AuthGuard.tsx`, `src/middleware.ts` | Client auth + server-side role guard |
| Shared dashboard state | `src/lib/DashboardContext.tsx`, `src/lib/userDashboardData.ts` | Central state orchestration |
| Data access layer | `src/lib/supabase/**/*` | Supabase clients, services, types |
| DB schema + RLS | `supabase/schema.sql` | Tables, policies, triggers, sequences, storage |
| Product/design intent | `docs/website-purpose.md`, `docs/implementation-memory.md`, `docs/ui-design-guidelines.md`, `memory.md` | Read before changing flows or styling |
| Redirect/notification routing | `src/lib/userFlow.ts` | Post-login redirect, notification hrefs, school doc matching |

## Domain Model

### Core Types (from `userDashboardData.ts`)

| Type | Key fields | Purpose |
|------|-----------|---------|
| `BookingItem` | id, schoolId?, school, topic, category, dateISO, session, status, timeline, goal, notes, rating, feedback, supervisorNotes | A mentoring session request |
| `RiwayatItem` | id, schoolId?, dateISO, school, session, title, description, status, bookingId?, supervisorNotes, followUpItems, documents | Completed session history |
| `SchoolDocument` | id, schoolId?, fileName, stage, reviewStatus, bookingId?, historyId?, version, storagePath | Uploaded document |
| `SchoolProfile` | schoolName, npsn, educationLevel, address, officialEmail, phone, principalName, operatorName, district | School identity |
| `Notification` | id, title, message, type, referenceId?, referenceType?, isRead, createdAt | In-app notification |
| `AuthUser` | id, email, name, role ("school" \| "admin") | Authenticated user |

### Booking Status Lifecycle

```
Menunggu → Disetujui → Dalam Proses → Selesai
         → Ditolak
         → Dibatalkan
```

### Document Stages

`Melayani` → `Adaptif` → `Pelaksanaan` → `Laporan`

### Document Review Status

`Menunggu Review` → `Disetujui` or `Perlu Revisi`

### Service Categories

`Workshop` · `Training Class` · `Seminar` · `Pendampingan` · `Supervisi` · `Konsultasi`

## DB Schema Summary (from `supabase/schema.sql`)

| Table | Primary Key | Key FK | RLS |
|-------|------------|--------|-----|
| `profiles` | uuid (→ auth.users) | — | Users read own; admin reads all |
| `bookings` | text id | school_id → profiles | School reads/inserts own; admin reads/updates all |
| `documents` | text id | school_id → profiles, booking_id → bookings | School CRUD own; admin reads/updates all |
| `histories` | text id | school_id → profiles, booking_id → bookings | School reads/updates own; admin reads/inserts/updates all |
| `notifications` | text id | user_id → profiles | Users read/update own; admin can insert any |

**Triggers:**
- `on_auth_user_created` → auto-creates profile row from `raw_user_meta_data`
- `on_booking_created_notify_admins` → inserts notification for all admin users
- `on_booking_cancelled_notify_admins` → notifies admins on status change to "Dibatalkan"
- `on_document_created_notify_admins` → notifies admins on document insert

**Sequences:** DB has `booking_id_seq`, `doc_id_seq`, `history_id_seq`, `notif_id_seq` for readable IDs, but client code generates its own IDs via `nextId()`.

**Storage:** `school-documents` bucket, folder-per-user (`{schoolId}/{timestamp}_{filename}`), RLS restricts to own folder; admin can read all.

## Component Architecture

| Component | File | Props | Consumes | Used By |
|-----------|------|-------|----------|---------|
| `Button` | `src/components/ui/Button.tsx` | variant, size, href, onClick, loading, disabled, type, className, ariaLabel | None | All pages |
| `Modal` | `src/components/ui/Modal.tsx` | open, onClose, title, children, footer | None | Admin booking, dokumen, sekolah pages |
| `ToastContainer` | `src/components/ui/Toast.tsx` | — | `useDashboard()` → toasts, removeToast | DashboardShell, AdminShell |
| `DashboardDataState` | `src/components/dashboard/DashboardDataState.tsx` | variant (loading/empty/error), title, description, onRetry | None | Dashboard pages (optional) |
| `MarketingHeader` | `src/components/layout/MarketingHeader.tsx` | logoSrc, brandName, navItems, loginHref, registerHref, showLogo | None | Landing page |
| `MarketingFooter` | `src/components/layout/MarketingFooter.tsx` | id, logoSrc, brandName, summary, textureSrc, contactItems, showLogo | None | Landing page |
| `DashboardShell` | `src/components/dashboard/DashboardShell.tsx` | brandLogoSrc, brandName, areaLabel, navItems, action, children | `useAuth()` → logout; `useDashboard()` → profile, addToast | All school dashboard pages |
| `AdminShell` | `src/components/admin/AdminShell.tsx` | navItems, children | `useAuth()` → logout; `useDashboard()` → addToast | All admin dashboard pages |
| `AuthGuard` | `src/components/auth/AuthGuard.tsx` | children, requiredRole | `useAuth()` → user, isAuthenticated, loading | Dashboard layouts |
| `AppProviders` | `src/components/providers/AppProviders.tsx` | children | — | Root layout |

## Conventions

- **Path alias:** Use `@/*` from `tsconfig.json` for imports from `src/`.
- **Styling:** Mixed approach — Tailwind utility classes dominate page content; CSS Modules on shells, marketing layout, and selected pages. Match the file's existing pattern.
- **Route boundaries:** School routes stay under `src/app/dashboard/*`; admin routes under `src/app/dashboard-admin/*`.
- **Provider order:** `AuthProvider` wraps `DashboardProvider` in `AppProviders.tsx`. Do not reorder.
- **Supabase access:** Centralized under `src/lib/supabase/`. Do not scatter client creation or direct env reads elsewhere.
- **Server vs browser:** `createClient()` for browser, `createServerSupabaseClient()` for server components. Middleware uses its own cookie-refreshing client.
- **Role-based access:** Two layers — middleware does server-side role check; AuthGuard does client-side redirect. Both must agree.
- **ID generation:** Client-side `nextId()` in DashboardContext uses a monotonic counter. DB has sequences (`next_booking_id()`, etc.) but client does not call them.
- **Language:** UI text is in Bahasa Indonesia. Keep it consistent.

## Anti-Patterns In This Project

- **Do not assume full persistence.** The project has Supabase integration but some flows may still have gaps. Check `memory.md` and `docs/implementation-memory.md` for known limitations.
- **Do not flatten the mixed styling approach during a bugfix.** Follow the file's current pattern unless the task is explicitly a style-system migration.
- **Do not bypass AuthGuard or middleware** when editing dashboard routes. Both layers enforce role-based access.
- **Do not scatter Supabase client creation.** Use the factories in `src/lib/supabase/client.ts` and `server.ts`.
- **Do not treat school data as fully multi-tenant-safe** without checking current implementation. Legacy `schoolName`-based grouping still exists alongside newer `schoolId` fields.
- **Do not reorder providers.** `AuthProvider` must wrap `DashboardProvider` because DashboardContext consumes `useAuth()`.

## Commands

```bash
npm install
npm run dev       # Next.js dev server
npm run lint      # ESLint
npm run build     # Production build (may need NODE_OPTIONS=--max-old-space-size=4096 on Windows)
npm run start     # Production server
```

## Testing

- `playwright.config.ts` exists pointing to `./tests` but no test files or `tests/` directory exist yet.
- An `E2E_TEST_MODE` env var bypasses middleware protection for E2E runs.
- Treat lint and build as the current reliable validation paths.

## Notes

- **React Compiler** is enabled (`reactCompiler: true` in `next.config.ts`). Some `useCallback` dependency arrays may trigger compiler warnings if they don't match inferred deps.
- **Build on Windows** may OOM with default Node heap. Use `NODE_OPTIONS=--max-old-space-size=4096`.
- **Middleware** uses `updateSession` from `src/lib/supabase/middleware.ts` which refreshes Supabase cookies and enforces role-based dashboard access.
- **`memory.md`** is the long-form historical record; prefer it and `docs/` over `README.md` when they disagree about current state.
- **Fonts:** Fraunces (display headings) + Plus Jakarta Sans (body/interface).
- **Design language:** Navy/slate palette, gold accent (`#d2ac50`), generous spacing, subtle borders over heavy shadows. See `docs/ui-design-guidelines.md`.
- **`package-lock.json`** is present; default to `npm` for local commands.
- **No CI workflows** committed (no `.github/workflows/` found).
