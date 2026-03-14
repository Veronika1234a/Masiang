# SUPABASE LAYER MEMORY

## Overview
- This directory owns Supabase client creation and the typed service modules used by `AuthContext` and `DashboardContext`.
- It is the boundary between UI/context code and persisted data/session behavior.

## Where To Look
| Task | Location | Notes |
|------|----------|-------|
| Browser client | `src/lib/supabase/client.ts` | Creates the browser Supabase client. |
| Server client | `src/lib/supabase/server.ts` | Creates the server client with cookie bridging. |
| Middleware refresh | `src/lib/supabase/middleware.ts` | Session refresh path used by `src/middleware.ts`. |
| Auth flows | `src/lib/supabase/services/auth.ts` | Sign-in, sign-up, sign-out, and profile lookup support. |
| School profile data | `src/lib/supabase/services/profiles.ts` | Used by auth/profile flows. |
| Booking/document/history state | `src/lib/supabase/services/bookings.ts`, `src/lib/supabase/services/documents.ts`, `src/lib/supabase/services/histories.ts`, `src/lib/supabase/services/notifications.ts`, `src/lib/supabase/services/storage.ts` | Dashboard data access modules. |
| Shared DB typing | `src/lib/supabase/types.ts` | Base `Database` types for the service layer. |

## Conventions
- Keep Supabase client factories in `client.ts`, `server.ts`, and `middleware.ts`; reuse them instead of creating ad hoc clients elsewhere.
- Use the generated/shared `Database` typing from `types.ts` when working in this layer.
- Keep service modules domain-scoped by file name (`auth`, `profiles`, `bookings`, `documents`, `histories`, `notifications`, `storage`).
- Prefer calling this layer from contexts or route logic rather than embedding table/storage logic directly in components.

## Environment Assumptions
- Current client and server factories read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` directly.
- Missing env values will break runtime client creation, so verify env setup before debugging higher-level auth or dashboard bugs.

## Anti-Patterns
- Do not duplicate Supabase env access in unrelated files when the existing factories already own it.
- Do not bypass the typed service layer by pushing direct Supabase calls into page components unless a task explicitly restructures that boundary.
- Do not assume every dashboard workflow is fully normalized yet; project memory still calls out unfinished `schoolId` scoping work.
