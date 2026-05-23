# APExplorer

> API Explorer & Binary Analyzer — a developer and security research tool for reverse-engineering APIs and performing static file analysis.

![Dashboard](https://img.shields.io/badge/stack-TypeScript-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## Features

- **API Explorer** — Postman-like request builder with cURL import, headers/params/body editor, response viewer with JSON syntax highlighting, and per-request history
- **File Analyzer** — Upload any file to get MD5/SHA256 hashes, Shannon entropy, MIME detection, extracted strings, hex dump, and automatic suspicious-flag detection (PE binaries, high entropy, dangerous string patterns)
- **Collections** — Organize saved requests into color-coded groups
- **Dashboard** — Stats overview with HTTP method breakdown and status code distribution charts

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui, Recharts, wouter |
| Backend | Node.js 24, Express 5, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| API contract | OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas) |
| File analysis | Node.js `crypto` (MD5/SHA256), custom entropy/strings/hex engine |

## Architecture

```
├── artifacts/
│   ├── apexplorer/        # React + Vite frontend
│   └── api-server/        # Express API server
├── lib/
│   ├── api-spec/          # OpenAPI spec (source of truth)
│   ├── api-client-react/  # Generated React Query hooks
│   ├── api-zod/           # Generated Zod schemas (used by backend)
│   └── db/                # Drizzle schema + migrations
└── scripts/               # Utility scripts
```

**Contract-first flow:** Edit `lib/api-spec/openapi.yaml` → run codegen → frontend hooks and backend validators are auto-generated.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Setup

```bash
# Install dependencies
pnpm install

# Set your database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/apexplorer"

# Push database schema
pnpm --filter @workspace/db run push

# Regenerate API hooks (if you change the OpenAPI spec)
pnpm --filter @workspace/api-spec run codegen
```

### Run

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5173)
pnpm --filter @workspace/apexplorer run dev
```

Open [http://localhost:5173](http://localhost:5173)

## File Analysis Capabilities

| Feature | Details |
|---------|---------|
| Hashing | MD5, SHA-256 |
| Entropy | Shannon entropy (0–8 scale) |
| MIME detection | Magic byte signatures for 12+ file types |
| String extraction | Printable ASCII strings (min length 4), up to 500 |
| Hex dump | First 256 bytes, formatted with address + ASCII |
| Suspicious flags | High entropy, PE/ELF binaries, dangerous string patterns |

## Screenshots

| Dashboard | API Explorer |
|-----------|-------------|
| Stats, charts, recent activity | Request builder, cURL import, response viewer |

| File Analyzer | Collections |
|---------------|-------------|
| Upload, hashes, strings, hex dump | Organized request groups |

## License

MIT
