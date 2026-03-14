# MASIANG Site

Landing page and onboarding UI for MASIANG (Sistem Pendampingan Pendidikan), built with Next.js App Router.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- CSS Modules

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Project Structure

- `src/app/page.tsx`: marketing landing page.
- `src/app/login/page.tsx`: login form UI (frontend validation only).
- `src/app/daftar-sekolah/page.tsx`: school registration UI (frontend validation only).
- `src/components/layout/*`: reusable marketing header/footer components.
- `src/components/ui/Button.tsx`: reusable typed button primitive.
- `public/assets/masiang/*`: local visual assets used across pages.

## Notes

- Form submit handlers in `/login` and `/daftar-sekolah` are intentionally mocked for UI validation flow.
- Backend/API integration is not included in this phase.
- All image assets are served from local `public/assets/masiang` paths for stable builds and predictable performance.

## Documentation

- `docs/website-purpose.md`: penjelasan website MASIANG dan tujuan produk.
- `docs/implementation-memory.md`: catatan implementasi yang sudah ada + backlog prioritas.
