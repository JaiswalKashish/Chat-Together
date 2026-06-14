# ChaloTogether

A verified student mobility platform for Chennai college students — ride sharing, communities, real-time messaging, and safety tools built exclusively for verified college students.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/chalotogether run dev` — run the React frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- API: Express 5 + Pino logging + Socket.io
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Maps: OpenStreetMap iframe embed (no API key required)
- Auth: JWT Bearer stored as `ct_token` in localStorage

## Where things live

- `artifacts/chalotogether/src/` — React frontend
  - `pages/` — one file per route page
  - `components/layout/DashboardLayout.tsx` — sidebar + mobile nav
  - `contexts/AuthContext.tsx` — JWT auth state
  - `contexts/SocketContext.tsx` — Socket.io connection management
- `artifacts/api-server/src/` — Express API
  - `routes/` — route handlers grouped by feature
  - `lib/socket.ts` — Socket.io initialization
- `lib/db/src/schema.ts` — Drizzle schema (source of truth for DB)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated hooks (do not edit)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks + Zod schemas used everywhere
- All routes require JWT Bearer auth via `requireAuth` middleware; public exceptions: `/api/auth/*`, `/api/track/:token`
- Phone format enforced as `+91XXXXXXXXXX`; demo mode returns OTP codes in response body
- Socket.io mounted at `/api/socket.io` path to go through the shared reverse proxy correctly
- Maps use OpenStreetMap iframe embeds — no Google Maps API key required

## Product

- **Auth**: JWT-based register (3-step wizard) + login with college/department selection
- **Verification**: Student ID upload with OTP verification flow
- **Communities**: Auto-assigned to college community; browse and join other communities; member directory
- **Rides**: Offer rides with AI match scoring; find/filter rides; OTP verification for pickup; live tracking via public shareable link (OSM map)
- **Bookings**: Request, accept, reject, cancel booking flow with driver OTP verification
- **Messages**: Real-time chat via Socket.io with read receipts and conversation list
- **Safety**: Trusted contacts management (up to 5) + SOS button that alerts all contacts with location
- **Events**: Browse upcoming college events with ride pool count
- **Leaderboard**: Reliability score ranking across students

## DB Tables

`users`, `colleges`, `communities`, `community_members`, `student_verifications`, `events`, `rides` (extended: time/vehicle/fare/waypoints/trackingToken), `ride_bookings`, `messages`, `trusted_contacts`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Never call `pnpm run dev` at workspace root — use workflow restart or per-package filter
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before building frontend
- `useJoinCommunity` / `useLeaveCommunity` take `{ id: number }` (path param, not body)
- `useGetRide` and `useGetRideBookings` need explicit `queryKey` in their query options (generated hook requirement)
- Socket.io path must be `/api/socket.io` in both `initSocket()` server-side and `io()` client-side calls

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
