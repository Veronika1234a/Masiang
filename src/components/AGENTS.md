# COMPONENT ARCHITECTURE MEMORY

## Overview
Components are organized by domain: `ui/` for primitives, `layout/` for marketing chrome, `dashboard/` for school shell, `admin/` for admin shell, `auth/` for route protection, and `providers/` for context wrapping.

## Primitives (`src/components/ui/`)

| Component | File | Props | Consumes | Used By |
|-----------|------|-------|----------|---------|
| `Button` | `Button.tsx` | variant (primary/ghost/dark/outline), size (sm/md/lg), href?, onClick?, loading?, disabled?, type?, className?, ariaLabel? | None | Every page and shell |
| `Modal` | `Modal.tsx` | open, onClose, title, children, footer? | None | Admin booking, dokumen, sekolah pages |
| `ToastContainer` | `Toast.tsx` | — | `useDashboard()` → toasts, removeToast | DashboardShell, AdminShell (via layout) |
| `DashboardDataState` | `DashboardDataState.tsx` | variant (loading/empty/error), title?, description?, onRetry? | None | Dashboard pages (optional) |

**Button behavior:** Renders `<Link>` when `href` is provided, `<button>` otherwise. Shows "Memproses..." when `loading`. Disables interaction when `loading` or `disabled`.

**Modal behavior:** Manages body overflow, Escape key listener, overlay click-to-close, and fade-in animation.

**Toast behavior:** Fixed bottom-right positioning, max 380px width, auto-dismiss via `removeToast`.

## Layout Components (`src/components/layout/`)

| Component | File | Props | Consumes | Used By |
|-----------|------|-------|----------|---------|
| `MarketingHeader` | `MarketingHeader.tsx` | logoSrc, brandName, navItems, loginHref, registerHref, showLogo? | None | `src/app/page.tsx` |
| `MarketingFooter` | `MarketingFooter.tsx` | id?, logoSrc, brandName, summary, textureSrc, contactItems, showLogo? | None | `src/app/page.tsx` |
| `LandingProfilePhoto` | `LandingProfilePhoto.tsx` | primarySrc, fallbackSrc, alt, width, height | None | `src/app/page.tsx` |

**MarketingHeader:** Responsive with mobile menu (focus trap, Escape close, body scroll lock). Closes on resize past 1120px.

## Shell Components

| Component | File | Props | Consumes | Used By |
|-----------|------|-------|----------|---------|
| `DashboardShell` | `DashboardShell.tsx` | brandLogoSrc, brandName, areaLabel, navItems, action?, children | `useAuth()` → logout; `useDashboard()` → profile, addToast | `src/app/dashboard/layout.tsx` |
| `AdminShell` | `AdminShell.tsx` | navItems, children | `useAuth()` → logout; `useDashboard()` → addToast | `src/app/dashboard-admin/layout.tsx` |

**Shared CSS Module:** Both shells import `DashboardShell.module.css` for layout (sidebar + main content, topbar, nav items).

**NotificationBell (school):** Inline component in DashboardShell. Shows last 6 notifications with icons by type. Routes to detail pages via `getNotificationHref`.

**AdminNotificationBell:** Inline component in AdminShell. Shows last 5 notifications. Simpler layout than school bell.

**Active nav detection:** Both shells sort nav items by path length (longest first) and match `pathname.startsWith(item.href)`.

## Auth Protection

| Component | File | Props | Consumes | Used By |
|-----------|------|-------|----------|---------|
| `AuthGuard` | `AuthGuard.tsx` | children, requiredRole ("school"/"admin") | `useAuth()` → user, isAuthenticated, loading | `src/app/dashboard/layout.tsx`, `src/app/dashboard-admin/layout.tsx` |

**Behavior:**
- Loading → shows skeleton.
- Not authenticated → redirects to `/login` with `?redirectTo=`.
- Wrong role → redirects to correct dashboard.
- Authenticated + correct role → renders children.

## Providers

| Component | File | Props | Consumes | Used By |
|-----------|------|-------|----------|---------|
| `AppProviders` | `AppProviders.tsx` | children | — | `src/app/layout.tsx` |

**Structure:** `AuthProvider` wraps `DashboardProvider`. This order is critical because `DashboardContext` calls `useAuth()` internally.

**ToastContainer** is rendered inside `AppProviders` so it's available across all routes.

## Icon System

- DashboardShell and AdminShell generate nav icons via label-matching functions (`getNavIcon`, `getAdminNavIcon`).
- Notification icons are type-matched in DashboardShell (`getNotifIcon`, `getNotifIconBg`).
- All icons are inline SVGs with consistent stroke widths (1.8 for nav, 2.0-2.2 for notifications).

## Conventions
- All dashboard/admin components are client components (`"use client"`).
- Marketing components are server components where possible (MarketingHeader is client for mobile menu state).
- CSS Modules are used for shells and marketing layout; Tailwind utilities for page content.
- No external icon libraries — all icons are inline SVGs.
