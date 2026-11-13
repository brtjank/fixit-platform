# FixIt Web

Frontend for the FixIt service-operations API. React 19 · Vite · TypeScript · Tailwind v4 · TanStack Query · MSW.

## Quick start (no backend needed)

```bash
cd web
npm install
npm run dev          # http://localhost:5173 — VITE_API_MODE=mock by default
```

Sign in with one of the demo accounts shown on the login page (one click). Every demo account uses the
password `Demo123!` — passwords are verified in both modes (`DEMO_PASSWORD` in `src/mocks/data/seed.ts`):

| Role     | Email                              |
| -------- | ---------------------------------- |
| Admin    | marta.nowak@hydro-serwis.pl        |
| Worker   | tomasz.kowalczyk@hydro-serwis.pl   |
| Customer | bartosz.jankowski@gmail.com        |

## Running against the real backend

```bash
# 1. backend
docker-compose up -d && ./scripts/migrate-database.sh
psql "host=localhost port=5433 dbname=FixItDb user=postgres password=postgres" -f web/dev/seed.sql
dotnet run --project src/FixIt.Api            # http://localhost:5177

# 2. frontend
cd web && VITE_API_MODE=live npm run dev       # /api is proxied to the backend
```

In live mode the real endpoints (`/api/auth/login`, `/api/service-requests*` including `/{id}/logs`,
`/api/users*` — list, workers, me, `{id}`, invite/edit/activate/deactivate, own password change and admin
password reset — and `/api/workers/profiles`, `/api/workers/{userId}/profile`) hit the API; everything the backend does not
implement yet is still served by MSW — see [`docs/API_GAPS.md`](docs/API_GAPS.md). UI backed by mocked endpoints is marked with a small
"Mocked" badge.

## Languages

The UI ships in English and Polish. The language is detected from the browser on first visit and can be
changed from the top bar switcher or in Settings → Language (saved per device). Translations live in
`src/locales/<lang>/<namespace>.json`; see the i18n section of `ARCHITECTURE.md` for conventions.

## Scripts

| Script          | What it does                      |
| --------------- | --------------------------------- |
| `npm run dev`   | Vite dev server with HMR          |
| `npm run build` | Typecheck + production build      |
| `npm run lint`  | oxlint                            |
| `npm run preview` | Serve the production build      |

## Docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — stack, folder layout, data flow, conventions
- [`docs/API_GAPS.md`](docs/API_GAPS.md) — mocked endpoints and proposed backend contracts
