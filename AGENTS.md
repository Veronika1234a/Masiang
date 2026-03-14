# PROJECT KNOWLEDGE BASE

## Overview
- MASIANG is a Next.js 16 App Router project for school mentoring workflows: public marketing pages, school-facing dashboard flows, and admin review flows.
- The current product is partly wired to Supabase, but the docs still describe this codebase as a prototype phase with mocked or incomplete backend behavior in several areas.

## Structure
```text
masiang-site/
|- src/app/                 App Router routes for marketing, school dashboard, and admin dashboard
|- src/components/          Reusable shells, layout pieces, auth guard, and UI primitives
|- src/lib/                 Context state, seed/model helpers, and Supabase access layer
|- src/lib/supabase/        Browser/server/middleware clients plus domain service modules
|- public/assets/masiang/   Local visual assets used by marketing pages
|- docs/                    Product scope, implementation notes, and UI design guidelines
|- supabase/                SQL schema and seed files
|- memory.md                Long-form historical implementation memory
```

## Where To Look
| Task | Location | Notes |
|------|----------|-------|
| App bootstrapping | `src/app/layout.tsx`, `src/components/providers/AppProviders.tsx` | Providers wrap the app with auth and dashboard state. |
| Public pages | `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/daftar-sekolah/page.tsx` | Marketing and auth entry points. |
| School dashboard | `src/app/dashboard/**/*`, `src/components/dashboard/DashboardShell.tsx` | User routes live under `dashboard`; shell is shared. |
| Admin dashboard | `src/app/dashboard-admin/**/*`, `src/components/admin/AdminShell.tsx` | Admin routes and shared admin chrome. |
| Auth/session behavior | `src/lib/AuthContext.tsx`, `src/components/auth/AuthGuard.tsx`, `src/middleware.ts` | Client auth state plus middleware session refresh. |
| Shared dashboard state | `src/lib/DashboardContext.tsx`, `src/lib/userDashboardData.ts` | Main state orchestration and domain types. |
| Data access | `src/lib/supabase/**/*` | Supabase client factories and service wrappers. |
| Product/design intent | `docs/website-purpose.md`, `docs/implementation-memory.md`, `docs/ui-design-guidelines.md`, `memory.md` | Read these before changing flows or styling direction. |

## Conventions
- Use the `@/*` path alias from `tsconfig.json` instead of deep relative imports when importing from `src/`.
- Match the local styling pattern instead of forcing one system globally: this repo mixes utility-class-heavy pages with CSS Modules on shells, marketing layout, and selected route files.
- Keep user and admin route work inside their existing App Router boundaries: `src/app/dashboard/*` for school flows and `src/app/dashboard-admin/*` for admin flows.
- Preserve provider order in `src/components/providers/AppProviders.tsx`: `AuthProvider` wraps `DashboardProvider`.
- Supabase access is centralized under `src/lib/supabase/`; avoid scattering client creation or direct env reads elsewhere.

## Anti-Patterns In This Project
- Do not assume real persistence everywhere. Existing docs still call out mocked/demo-era behavior and incomplete backend integration.
- Do not flatten the mixed styling approach during a bugfix. Follow the file's current pattern unless the task is explicitly a style-system migration.
- Do not treat school data as fully multi-tenant-safe without checking current implementation notes. `memory.md` explicitly calls out remaining `schoolName`/`schoolId` gaps.
- Do not remove or bypass `AuthGuard` and middleware session handling when editing dashboard routes.

## Commands
```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

## Workflow Signals
- `package-lock.json` is present, so default to `npm` for local commands unless the repo is intentionally migrated.
- No committed `.github/workflows/*` files were found during initialization, so CI expectations are not yet defined in-repo.

## Testing And Validation
- `playwright.config.ts` exists and points to `./tests`, but no `tests/` directory or `*.test`/`*.spec` files were found during initialization.
- Treat lint and build as the current reliable validation paths unless new automated tests are added.

## Notes
- `README.md` still describes the app as landing/onboarding UI, while `memory.md` and `docs/implementation-memory.md` document a much broader dashboard feature set. Prefer the more recent memory/docs when the files disagree.
- Environment-dependent Supabase client creation currently relies on `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- There is an existing `memory.md`; keep it as historical context, and use this `AGENTS.md` as the concise operational guide for future work.
