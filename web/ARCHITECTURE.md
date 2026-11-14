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
  and on 401 for an authenticated request clears the session; the login page then shows a one-time
  "session ended" notice (`sessionEnded` in the session store; not shown on logout or a failed login).
- Mutations invalidate related query keys and toast success/errors. Pages don't call `fetch` directly.
- Session (`features/auth/session.ts`) persists `{ token, userId, tenantId, role }` plus a best-effort
  profile (name, email, tenant name) from `GET /api/users/me`.

## API modes

`VITE_API_MODE=mock` (default) — every request is served by MSW from `src/mocks/data/seed.ts`.
`VITE_API_MODE=live` — real endpoints go through the Vite proxy to `http://localhost:5177` (kept for
convenience; the backend also allows `http://localhost:5173` via CORS);
MSW still serves the endpoints listed in `docs/API_GAPS.md` (it decodes the real JWT to apply policies).

Mock handlers mirror the backend precisely: policies (`AdminOnly`, `WorkerOrAdmin`, `CustomerOrAdmin`),
domain rules (assignment only when Pending; Completed/Cancelled immutable; InProgress requires a worker),
error codes (`RES_001_NOT_FOUND`, `SR_001_STATUS_IMMUTABLE`, …), and numeric enums. Mock login verifies
passwords against a per-user map in the mock db (seeded with `DEMO_PASSWORD` = `Demo123!`, updated by the
password endpoints); live mode checks the PBKDF2 hash stored by `dev/seed.sql`.

## Roles & routes

| Route               | Admin | Worker | Customer | Notes                                            |
| ------------------- | :---: | :----: | :------: | ------------------------------------------------ |
| `/` (Home)          | Dashboard | Dashboard | My requests | `app/pages/HomePage.tsx` switches on role; dashboard endpoints real |
| `/requests`         |  ✅   |   ✅   |    –     | list + filters + search/sort + pagination (real) |
| `/requests/new`     |  ✅   |   –    |    ✅    | create (real)                                    |
| `/requests/:id`     |  ✅   |   ✅   |    ✅    | detail, actions, timeline (real)                 |
| `/my-assignments`   |   –   |   ✅   |    –     | `assignedWorkerId=me` (real)                     |
| `/workers`, `/workers/:id` | ✅ | ✅  |    –     | users/workers + profiles + workload (real)       |
| `/users`            |  ✅   |   –    |    –     | list, invite, edit, (de)activate, reset password (real) |
| `/settings`         |  ✅   |   ✅   |    ✅    | profile, password, organization, notification preferences (real), appearance (local) |
| `/notifications`    |  ✅   |   ✅   |    ✅    | mock                                             |

Route-level gates: `RequireAuth` (redirects to `/login`), `RequireRole` (renders a 403 state).

## Conventions

- Pages: `export default function XPage()`, use `PageHeader`, handle loading (`Skeleton`/`PageSpinner`),
  error (`ErrorState` with retry) and empty (`EmptyState`) states explicitly.
- Anything rendered from a mock-only endpoint shows a small `<MockBadge />` near its heading.
- Field-level API errors (e.g. `USR_005_EMAIL_TAKEN`, `USR_007_PASSWORD_TOO_WEAK`, `USR_008_PASSWORD_MISMATCH`,
  the organization form's `TEN_001`/`TEN_003`–`TEN_008`) are mapped onto the form field with `setError` in the
  mutation's `onError`; the hook skips the toast for those codes (`isFieldError`, `isTenantFieldError`) and the
  dialog's banner shows only the remaining errors.
- Passwords use `PasswordInput` (`shared/ui/Input.tsx`, show/hide toggle); the 8–128 policy lives in `usersApi.ts`.
- Status labels/colors come from `shared/lib/status.ts` — never hardcode.
- Dates via `formatDate/formatDateTime/formatRelative`; names via `fullName`; GUIDs via `shortId(id, 'SR')`.
- Tailwind: use semantic tokens (`bg-surface`, `text-fg-muted`, `border-border`, `bg-brand`, tones `*-soft/*-fg`).
  Both themes must look right — never use raw grays/whites.
- Forms: react-hook-form + zod schema colocated with the form component; `FormField` wires labels/errors.
- Keep components under ~200 lines; split into `components/` when a page grows.

## Internationalisation (i18n)

- Library: `i18next` + `react-i18next`. Setup in `src/i18n/index.ts`; the active language lives in a
  persisted zustand store (`useLanguage()`), defaults from `navigator.language` (pl → Polish, else English).
- Resources: `src/locales/<lang>/<namespace>.json`, auto-registered via `import.meta.glob`. One namespace
  per feature (`common`, `auth`, `dashboard`, `requests`, `users`, `workers`, `settings`, `notifications`).
  English is the source language; every key must exist in both files.
- Usage: `const { t } = useTranslation('requests')` then `t('list.title')`; cross-namespace keys as
  `t('common:actions.save')`. Interpolation `{{name}}`; plurals with `count` and `_one/_few/_many/_other`
  suffixes (Polish needs all four, English `_one/_other`).
- Shared helpers already translated: `statusLabel()`, `statusDescription()`, `roleLabel()`,
  `formatDate/formatDateTime/formatRelative` (date-fns locale), `errorMessage()`. Never read
  `STATUS_META[x].label` / `ROLE_META[x].label` directly in UI.
- The whole tree is remounted on language change (`<AppProviders key={language}>`), so helpers that call
  `i18n.t` outside React hooks stay in sync.
- Switcher: `LanguageSwitcher` (top bar) and `LanguageSegmented` (settings) in `shared/ui`.
