# APExplorer

API Explorer & Binary Analyzer SaaS — a developer/security tool to reverse-engineer APIs (send requests, import cURL, inspect responses) and perform static file analysis (hashes, entropy, strings, hex dump).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/apexplorer run dev` — run the frontend (port 26270)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- File analysis: multer (upload), crypto (MD5/SHA256), custom entropy/strings/hex logic
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — DB schema: collections.ts, requests.ts, files.ts
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas (used by backend)
- `artifacts/api-server/src/routes/` — collections, requests, tools, files, dashboard
- `artifacts/apexplorer/src/pages/` — dashboard, explorer, files, collections
- `artifacts/apexplorer/src/components/layout.tsx` — sidebar nav

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → frontend hooks + backend Zod schemas
- File analysis is done server-side at upload time (multer memoryStorage), results stored in DB
- Ad-hoc requests (unsaved) go through `/api/tools/send-adhoc`; saved requests through `/api/requests/:id/send`
- Response body stored in DB for history; large responses may be truncated in the UI
- cURL parsing is done server-side via regex (no shell execution)

## Product

- **Dashboard**: Stats overview, method/status charts, recent requests
- **API Explorer**: Postman-like request builder with cURL import, headers/params/body editor, response viewer, request history
- **File Analyzer**: Drag-and-drop upload → MD5/SHA256 hashes, entropy, MIME detection, string extraction, hex dump, suspicious flag
- **Collections**: Organize saved requests into color-coded groups

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- File upload endpoint (`POST /api/files/analyze`) uses multipart/form-data — not covered by generated hooks, use raw fetch
- multer is in `dependencies` (not devDependencies) because it's a runtime dep
- The `recent` requests list only shows requests that have been executed (lastStatusCode IS NOT NULL)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
