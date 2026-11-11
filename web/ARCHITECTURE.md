# FixIt Web — Architecture

React 19 + Vite + TypeScript SPA for the FixIt backend (`src/FixIt.Api`). Feature-sliced, with a
thin shared layer. Everything the backend does not implement yet is served by Mock Service Worker.

## Stack

| Concern         | Choice                                              |
| --------------- | --------------------------------------------------- |
| UI              | React 19, Tailwind CSS v4 (design tokens in `src/styles/globals.css`), Radix primitives (`radix-ui`), lucide icons |
| Routing         | react-router v8 (`createBrowserRouter`, lazy pages) |
| Server state    | TanStack Query v5 (`src/shared/api/queryClient.ts`) |
| Client state    | zustand (session, theme)                            |
| Forms           | react-hook-form + zod                               |
| Charts          | recharts                                            |
| Mocks           | msw v3 (`src/mocks`)                                |
| Toasts          | sonner                                              |

## Folder layout

```
src/
  app/            composition root: router, layouts (AppShell, Sidebar, Topbar), guards, providers, navigation
  features/       one folder per domain feature
    <feature>/
      api/        typed API client for that feature (marks ✅ real vs ⚠ mock-only endpoints)
      hooks/      TanStack Query hooks + query keys (+ mutations with toasts/invalidation)
      components/ feature-specific components
      pages/      route components (default export, lazy-loaded by app/router.tsx)
  shared/
    api/          http client (fetch wrapper, bearer auth, ApiError), queryClient
    config/       env (VITE_API_MODE etc.)
    hooks/        useTheme, useDebounce, usePagination (URL-synced)
    lib/          cn, format (dates/names/ids), status (labels, tones, allowed transitions), jwt
    types/        API contracts mirroring the backend (enums are NUMERIC like the backend JSON)
    ui/           design-system components (Button, Input, FormField, Badge/StatusBadge/RoleBadge, Card,
                  Dialog, DropdownMenu, Tooltip, Table, Tabs, Switch, Pagination, Skeleton, EmptyState,
                  ErrorState, PageHeader, Avatar, MockBadge, Spinner)
  mocks/          MSW: seed data (deterministic), in-memory db, auth helpers, handlers (backend + mockOnly)
  styles/         globals.css — tokens, dark mode (`.dark` on <html>), base styles
```

Import alias: `@/` → `src/`.

## Data flow

Page → feature hook (`useX`) → feature api (`xApi`) → `http` → (MSW in mock mode | Vite proxy → backend).

- `http` adds `Authorization: Bearer <token>`, parses `{ errorCode, message, requestId }` into `ApiError`,
  and clears the session on 401.
- Mutations invalidate related query keys and toast success/errors. Pages don't call `fetch` directly.
- Session (`features/auth/session.ts`) persists `{ token, userId, tenantId, role }` plus a best-effort
  profile (name, email, tenant name) from the mock-only `/api/users/me`.

## API modes

`VITE_API_MODE=mock` (default) — every request is served by MSW from `src/mocks/data/seed.ts`.
`VITE_API_MODE=live` — real endpoints go through the Vite proxy to `http://localhost:5177`;
MSW still serves the endpoints listed in `docs/API_GAPS.md` (it decodes the real JWT to apply policies).

Mock handlers mirror the backend precisely: policies (`AdminOnly`, `WorkerOrAdmin`, `CustomerOrAdmin`),
domain rules (assignment only when Pending; Completed/Cancelled immutable; InProgress requires a worker),
error codes (`RES_001_NOT_FOUND`, `SR_001_STATUS_IMMUTABLE`, …), and numeric enums.

## Roles & routes

| Route               | Admin | Worker | Customer | Notes                                            |
| ------------------- | :---: | :----: | :------: | ------------------------------------------------ |
| `/` (Home)          | Dashboard | Dashboard | My requests | `app/pages/HomePage.tsx` switches on role |
| `/requests`         |  ✅   |   ✅   |    –     | list + filters + pagination (real)               |
| `/requests/new`     |  ✅   |   –    |    ✅    | create (real)                                    |
| `/requests/:id`     |  ✅   |   ✅   |    ✅    | detail, actions (real), timeline (mock)          |
| `/my-assignments`   |   –   |   ✅   |    –     | `assignedWorkerId=me` (real)                     |
| `/workers`, `/workers/:id` | ✅ | ✅  |    –     | users/workers (real) + profiles/workload (mock)  |
| `/users`            |  ✅   |   –    |    –     | list (real) + invite/edit/deactivate (mock)      |
| `/settings`         |  ✅   |   ✅   |    ✅    | tenant/preferences (mock), appearance (local)    |
| `/notifications`    |  ✅   |   ✅   |    ✅    | mock                                             |

Route-level gates: `RequireAuth` (redirects to `/login`), `RequireRole` (renders a 403 state).

## Conventions

- Pages: `export default function XPage()`, use `PageHeader`, handle loading (`Skeleton`/`PageSpinner`),
  error (`ErrorState` with retry) and empty (`EmptyState`) states explicitly.
- Anything rendered from a mock-only endpoint shows a small `<MockBadge />` near its heading.
- Status labels/colors come from `shared/lib/status.ts` — never hardcode.
- Dates via `formatDate/formatDateTime/formatRelative`; names via `fullName`; GUIDs via `shortId(id, 'SR')`.
- Tailwind: use semantic tokens (`bg-surface`, `text-fg-muted`, `border-border`, `bg-brand`, tones `*-soft/*-fg`).
  Both themes must look right — never use raw grays/whites.
- Forms: react-hook-form + zod schema colocated with the form component; `FormField` wires labels/errors.
- Keep components under ~200 lines; split into `components/` when a page grows.
