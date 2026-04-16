# LIB LAYER MEMORY

## Overview
This directory owns all shared state, auth logic, data orchestration, and Supabase access for the MASIANG app.

## Module Map

| File | Responsibility |
|------|---------------|
| `AuthContext.tsx` | Auth state, login/register/logout, role resolution, registered school list |
| `DashboardContext.tsx` | Central dashboard state: bookings, docs, histories, profile, notifications, toasts, and all CRUD actions |
| `userDashboardData.ts` | Domain types, constants, utilities |
| `userFlow.ts` | Redirect helpers, notification routing, school document matching for admin |
| `bookingPrint.ts` | Print utilities for booking records |
| `supabase/middleware.ts` | Session refresh and protected-route role guard used by `src/proxy.ts` |
| `supabase/` | Supabase clients, types, and domain service modules |

## AuthContext

**Exports:** `AuthProvider`, `useAuth`

**State:** `user` (AuthUser | null), `isAuthenticated`, `loading`, `registeredSchools`

**Key functions:**
- `login(identity, password)` → Server login API, validate role/approval, set user
- `register(payload)` → Server register API, create pending school account
- `logout()` → Supabase signOut, clear state
- `refreshSchools()` → Fetch all profiles with role="school"

**Called by:** `AppProviders`, `AuthGuard`, login page, registration page, admin sekolah page.

## DashboardContext

**Exports:** `DashboardProvider`, `useDashboard`

**State:** `bookings`, `documents`, `histories`, `profile`, `notifications`, `toasts`, `dashboardLoading`, `unreadCount`, `progress`

**Key actions (all optimistic with Supabase persistence):**
- `createBooking(data)` → Insert booking + notify admins
- `cancelBooking(id, reason)` → Update status + notify admins
- `approveBooking(id)` → Update status + notify school
- `rejectBooking(id, reason)` → Update status + notify school
- `startSession(id)` → Update status + notify school
- `confirmBookingDone(id)` → Create history, link docs, notify school
- `rateBooking(id, rating, feedback)` → Update booking
- `uploadDocument(file, stage, bookingId?)` → Upload to storage + insert doc record + notify admins
- `deleteDocument(id)` → Delete from storage + remove record
- `replaceDocument(id, file, stage)` → Delete old + upload new + notify admins
- `reviewDocument(id, reviewStatus, notes?)` → Update doc review status + notify school
- `updateProfile(updates)` → Update profile in DB
- `addSupervisorNotes(bookingId, notes)` → Update booking + notify school
- `markNotificationRead(id)` → Mark notification read
- `markAllNotificationsRead()` → Mark all read
- `addToast(message, type?)` / `removeToast(id)` → Flash messages

**Data loading:** On mount (when `user` exists), fetches all data from Supabase in parallel. Uses `schoolId` (user.id for school, undefined for admin) to filter queries.

**Notification targeting:** `pushNotif` supports `recipientUserIds` parameter. Admin actions target school owners; school actions target admins.

## userDashboardData.ts

**Domain types:** `BookingItem`, `RiwayatItem`, `SchoolDocument`, `SchoolProfile`, `Notification`, `StageProgress`, `FollowUpItem`, `RiwayatDocument`

**Type unions:** `BookingStatus`, `TimelineStatus`, `RiwayatStatus`, `DocumentStage`, `DocumentReviewStatus`, `ServiceCategory`, `NotificationType`, `RiwayatDocumentCategory`

**Constants:** `SERVICE_CATEGORIES`, `BOOKING_SESSION_OPTIONS`, `REQUIRED_DOCUMENTS`, `ALL_STAGES`

**Utilities:** `formatLongDateID`, `formatMediumDateID`, `formatShortDateID`, `getDateDiffFromToday`, `getBookingReminder`, `getBookingSummary`, `getNextBooking`, `getTodayISO`, `getTomorrowISO`, `normalizeBookingSession`, `getFormattedNow`, `getFormattedToday`

Runtime demo/seed exports have been removed from this module. Test fixtures live under `tests/e2e/support`.

## userFlow.ts

**Functions:**
- `buildProtectedRedirectTarget(pathname, search)` → Builds redirect target for middleware
- `resolvePostLoginRedirect(requested, fallback)` → Resolves post-login destination safely
- `getNotificationHref(area, notification)` → Maps notification type to route URL
- `getSchoolDocumentsForAdmin(input)` → Filters documents by school using `schoolId` with `schoolName` fallback for legacy data

## Supabase Layer (`src/lib/supabase/`)

### Clients
| File | Purpose |
|------|---------|
| `client.ts` | Browser Supabase client factory |
| `server.ts` | Server Supabase client with cookie bridging |
| `middleware.ts` | Session refresh for Next.js proxy |
| `types.ts` | Generated `Database` types from Supabase |

### Services

| Service | Functions | DB Table |
|---------|-----------|----------|
| `auth.ts` | `signIn`, `signUp`, `signOut`, `changePassword`, `updateUserMetadata`, `updateEmail`, `getSession`, `getProfile`, `onAuthStateChange` | auth.users, profiles |
| `profiles.ts` | `fetchProfile`, `updateProfile`, `fetchAllSchoolProfiles`, `fetchAdminUserIds` | profiles |
| `bookings.ts` | `fetchBookings`, `insertBooking`, `updateBooking`, `checkAvailability` | bookings |
| `documents.ts` | `fetchDocuments`, `insertDocument`, `updateDocument`, `deleteDocument` | documents |
| `histories.ts` | `fetchHistories`, `insertHistory`, `updateHistory` | histories |
| `notifications.ts` | `fetchNotifications`, `insertNotification`, `markRead(userId, notifId)` | notifications |
| `storage.ts` | `uploadFile`, `getSignedUrl`, `resolveDownloadUrl`, `deleteFile` | storage (school-documents bucket) |

### Row-to-Model Mappers
Each service exports a mapper function (`rowToBooking`, `rowToDocument`, `rowToHistory`) that converts Supabase rows to in-memory types. These populate the optional `schoolId` field from `school_id` column.

### Conventions
- All services use `createClient()` (browser client).
- Service functions throw on error; callers in `DashboardContext` catch and log.
- `school_id` is the source of truth for ownership; `school_name` is display-only.
- Storage paths follow `{schoolId}/{timestamp}_{filename}` pattern.
