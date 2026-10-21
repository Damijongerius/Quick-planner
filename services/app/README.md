# QuickPlanner app

Next.js app (App Router, server actions) backed by Postgres via Prisma. A separate MCP server
(`services/mcp`) gives the in-app AI assistant its tools.

## Running

Normally via the repo-root `docker-compose.yml` (app + MCP + Postgres). Without Docker:

```bash
npm install --legacy-peer-deps
npx prisma generate
npm run dev
```

## Configuration

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | app, mcp | Postgres connection string |
| `AUTH_SECRET` | app | Signs session tokens. `openssl rand -base64 32`. Never reuse a guessable value |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | app | Google OAuth sign-in |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | app | Optional GitHub sign-in (button appears only when both are set) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM` | app | Optional email: invites, magic-link sign-in, notification emails. Needs at least `SMTP_HOST` and a sender (`EMAIL_FROM`, or `SMTP_USER` if it is an address). `SMTP_SECURE` defaults to true on port 465 |
| `APP_URL` | app | Public address used in links inside emails and the API docs (falls back to `AUTH_URL`) |
| `WEBHOOK_ALLOW_PRIVATE` | app | `true` lets webhooks call `http://` and private/localhost addresses. Only for local testing; leave unset in production |
| `GEMINI_API_KEY`, `AI_MODEL` | app | AI assistant model |
| `MCP_SERVER_URL` | app | Defaults to `http://mcp:3001/sse` |
| `MCP_AUTH_TOKEN` | app **and** mcp | Shared bearer token. The MCP server refuses to start without it, and the app must send the same value |
| `WOL_ALLOWED_EMAIL`, `WOL_MAC_ADDRESS`, `WOL_BROADCAST_ADDRESSES` | app | Optional wake-on-LAN profile action |

### Local login without Google

Set `AUTH_DEV_LOGIN=true` to get a **“Continue as local dev user”** button on the sign-in page (signs in as
the email you type, default `dev@localhost` / `AUTH_DEV_LOGIN_EMAIL`; users are created on first use). It only activates when `AUTH_URL`
points at `localhost`/`127.0.0.1`, so setting it on a deployed instance does nothing. `docker-compose.yml` enables it by
default; `docker-compose.arm.yml` does not.

`docker-compose.yml` falls back to a dev-only `MCP_AUTH_TOKEN`; `docker-compose.arm.yml` requires
`AUTH_SECRET` and `MCP_AUTH_TOKEN` to be set in the environment.

### Sign-in methods

The sign-in page only offers what is configured: Google, GitHub, an **email link** (magic link, needs SMTP; each link works
once, expires after 15 minutes, and at most 3 are sent per address per 15 minutes) and the local dev login. A GitHub sign-in
for an address that already belongs to another method is refused instead of being merged silently.

## Existing (legacy) users

Email-only "legacy credentials" sign-in was removed: no password is stored, so it allowed anyone to
sign in as any legacy user. Legacy users sign in with the Google account that has the **same email
address**; the account is then linked automatically.

## Architecture notes

- `src/lib/actions/*` are the server actions. Every action authorizes through
  `requireProjectAccess` / `getProjectOwnerId` in `actions/helpers.ts` (project ownership, archived check).
  `helpers.ts` is deliberately **not** a `"use server"` file, otherwise each helper would become a public endpoint.
- Expected, user-fixable failures (duplicate field, dependency loop, ...) are returned as `{ error }`
  (`ActionResult`) because Next.js hides thrown messages in production. Unexpected failures throw.
- Pure logic lives in `src/lib/{validation,graph,status}.ts` and is unit tested.
- The AI assistant never executes a create/update/delete on its own: `/api/chat` returns it as a pending
  action and it only runs after the user clicks **Confirm**. `userId` and `confirmed` are set server-side only.

## Collaboration

- **Roles.** The project creator is the **Owner** (`Project.userId`). Everyone else is a `ProjectMember` with a role:
  **Editor** (create/change items, sprints, item types) or **Viewer** (read everything and comment). Only the owner manages
  members, renames, archives or deletes the project. The rules live in `src/lib/roles.ts`; the checks in
  `lib/actions/helpers.ts` (`requireProjectAccess` with a mode of `read` / `comment` / `edit` / `owner`) run in **every**
  server action, so hiding a button in the UI is never the only protection.
- **Invites.** Owners invite by email on the *Members* page. The invite is accepted automatically when that person signs in
  with the same email (it shows up in their project list), or via the copyable `/invite/<token>` link. Invites expire
  after 14 days, can be revoked, and only work for the invited email.
- **Assignees, comments, live updates.** Items can be assigned to members (filter by *Me / Unassigned / person* on the board
  and backlog), have a comment thread, and pages refresh themselves about every 20 seconds (`LiveRefresh`, paused while you type).
- Removing a member clears their assignments. Viewers can comment but not edit; archived projects are read-only for everyone.

### Live presence and instant updates

- **Stream.** Each open project page holds one server-sent-events connection (`GET /api/projects/:id/events`). The server
  pushes who is online and "something changed" notifications; every mutating server action calls `publishChange(...)`
  (`lib/realtime/hub.ts`). Teammates' pages refresh within about a second. Without a stream (offline, unsupported proxy) the
  app falls back to polling every 20 s, and reconnecting triggers a catch-up refresh.
- **Presence.** The sidebar shows who is online and where; item rows and board cards show the avatars of people who have that item
  open, with a pulsing ring while they type (`POST /api/projects/:id/presence`).
- **No silent overwrites.** The open item panel tracks what the server last said (`lib/mergeRemote.ts`). A teammate's change to a
  field you haven't touched is applied live; if you both changed the same field your save is paused and you choose
  **Use theirs** or **Keep mine**. Edits to different fields merge without any prompt.
- **Access.** Both endpoints require project membership (404 otherwise); removing someone closes their stream immediately.
- **Limits.** The hub lives in one server process, which is right for a single container. Running several instances needs a shared
  bus (Redis pub/sub) behind `RealtimeHub`. Reverse proxies must not buffer `text/event-stream` (the response sets
  `X-Accel-Buffering: no` for nginx). The same person in two tabs does not sync between those tabs.

### Testing collaboration locally

With `AUTH_DEV_LOGIN=true` the sign-in page lets you type **any email** to sign in as that user, so open a second browser
profile (or a private window) as another person, invite them from the first, and work together.

## Planning, reporting and timeline

- **Planning** (`/planning`): backlog on one side, a sprint on the other. Move items by drag, arrow or selection; the load is shown
  against the sprint's **capacity** (set under Sprints → Edit). Work is counted in points when an item type has a number field
  named like *Story points / Estimate / Effort / Size*, otherwise in items. Only leaf items count, so an epic and its tasks are not
  counted twice.
- **Reports** (`/reports`): burndown for a sprint (uses `Node.completedAt`, set whenever an item becomes Done; older Done items fall
  back to their last update) and velocity across sprints.
- **Timeline**: arrows between dependent items (red when the dependent starts before its blocker ends) and **milestones**.

## Notifications and activity

`@mention` someone in a comment, or be assigned an item, and they get a notification (bell, live over the event stream).
People **follow** items they create, are assigned or comment on; followers are told about status changes and comments. The item's
**Activity** tab merges comments and history. With SMTP configured, mentions and assignments are also emailed when the person is not
in the project at that moment (switch in Account → Email notifications).

## Import, export and templates

*Settings → Import & export*, or **Import from Jira, Trello, CSV…** when creating a project.

- Reads **Jira** CSV, **Linear** CSV, **Asana** CSV, **Trello** board JSON, this app's **JSON export**, and any CSV with a header row.
  Columns are matched automatically and can be changed; the preview lets you map statuses and item types before anything is created.
- Imports are one transaction (all or nothing), limited to 2,000 items / 5 MB per file. Missing item types, parent/child rules, fields
  and sprints are created; assignees are matched to project members by email or name. Loops in parents/dependencies are skipped with a warning.
- Export: JSON (whole project, re-importable) or CSV (formula-safe). Parsing lives in `src/lib/importer/*` (pure, unit tested); the
  transaction in `lib/actions/importCore.ts`.
- **Templates**: built-in (software sprint, bug tracker, marketing, personal kanban, blank) and your own (*Save as template*, optionally
  with starter items). Pick one in *New project*.

## REST API and webhooks

- Create a **personal API token** under *Account*. It is shown once and stored hashed. It acts as you (read-only tokens can only `GET`);
  120 requests per minute per token. `Authorization: Bearer qp_…`.
- Endpoints under `/api/v1`: projects, items (list with filters + paging, create, change, delete), comments, sprints. The OpenAPI
  description is at `/api/v1/openapi.json`. Requests run through the same server actions as the UI, so permissions, history,
  notifications and live updates behave identically.
- **Webhooks** (*Settings → Integrations*, owner only): signed `POST`s for `item.created`, `item.updated`, `item.status_changed`,
  `item.deleted`, `comment.created` (plus `ping`). Headers `X-QuickPlanner-Event`, `-Delivery`, `-Timestamp` and
  `X-QuickPlanner-Signature: sha256=HMAC_SHA256(secret, "<timestamp>.<body>")`; verify it and reject old timestamps. Failed deliveries are retried
  (1 s, 5 s, 25 s, in memory) and a receiver that fails 10 times in a row is switched off. Targets must be public `https://` addresses
  (checked again at delivery time, redirects are not followed).

## UI and styling

- **Tailwind CSS v4** (utilities + theme only, no reset) plus a small set of hand-written component classes.
- **Design tokens** live in `src/app/globals.css` (`--bg`, `--panel`, `--fg`, `--muted`, `--accent`, …) with a light and a dark set.
  Dark mode follows the OS and can be overridden per user (`data-theme` on `<html>`, toggled by `ThemeToggle`, applied
  before first paint from `layout.tsx`). Tailwind colours (`bg-panel`, `text-muted`, `border-border`, `bg-accent-soft`, …) map to these tokens, so never hard-code colours.
- **CSS layers**: `base` < `components` < `utilities`. Component stylesheets (`components/**/*.css`) are wrapped in
  `@layer components`, so a Tailwind utility on an element always wins over its component class.
- Shared building blocks: `components/ui/*` (Button, Input, Select, Modal, Switch, StatusBadge, …), `PageHeader`,
  and `lib/statusMeta.ts` (single source for status labels/colours).

## Checks

```bash
npm run typecheck
npm run lint
npm test
```
