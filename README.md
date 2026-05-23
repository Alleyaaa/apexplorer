<div align="center">

![capsule](https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,100:00FF41&height=180&section=header&text=APExplorer&fontSize=60&fontColor=00FF41&fontAlignY=45&desc=API%20Explorer%20%26%20Binary%20Analyzer&descAlignY=68&descSize=18&descColor=ffffff)

*A developer and security research tool for reverse-engineering APIs and performing static file analysis.*

[![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://docker.com)

[🚀 Live Demo](#-demo) · [📖 Documentation](#-api-documentation) · [🐛 Report Bug](https://github.com/Alleyaaa/apexplorer/issues) · [💡 Request Feature](https://github.com/Alleyaaa/apexplorer/issues)

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🎥 Screenshots](#-screenshots)
- [🛠 Tech Stack](#-tech-stack)
- [🏗 Architecture](#-architecture)
- [🚀 Getting Started](#-getting-started)
- [📚 API Documentation](#-api-documentation)
- [🔬 File Analysis](#-file-analysis)
- [🔒 Security](#-security)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📝 Changelog](#-changelog)
- [📄 License](#-license)

---

## ✨ Features

### 🌐 API Explorer
Postman-like request builder with full HTTP client capabilities:

- **cURL Import** — Paste any cURL command and auto-convert to a ready-to-use request
- **Headers / Params / Body Editor** — Intuitive form-based editor with JSON validation
- **Response Viewer** — Syntax-highlighted JSON with collapsible tree view
- **Request History** — Per-request history with timestamps and status codes
- **Environment Variables** — Switch between dev / staging / prod configs instantly

### 🔐 File Analyzer
Upload any file for instant static security analysis:

- **Hashing** — MD5 & SHA-256 checksums
- **Entropy Analysis** — Shannon entropy (0–8 scale) to detect packed or encrypted data
- **MIME Detection** — Magic byte signatures for 12+ file types
- **String Extraction** — Printable ASCII strings (min length 4), up to 500 results
- **Hex Dump** — First 256 bytes formatted with address + ASCII view
- **Suspicious Flags** — Auto-detection of PE/ELF binaries, high entropy, and dangerous string patterns

### 📁 Collections
- Create unlimited collections with color-coded groups
- Drag & drop reordering
- Export / import as JSON

### 📊 Dashboard
- HTTP method breakdown (GET, POST, PUT, DELETE, etc.)
- Status code distribution charts
- Recent activity feed & response time analytics

---

## 🎥 Screenshots

### 🔐 File Analyzer — Overview
> Hashes, entropy bar, MIME type detection at a glance

![File Analyzer Overview](docs/screenshots/file-analyzer-overview.png)

---

### 🔤 File Analyzer — Strings
> Extracted printable ASCII strings from the binary

![File Analyzer Strings](docs/screenshots/file-analyzer-strings.png)

---

### 🔢 File Analyzer — Hex Dump
> First 256 bytes rendered with address + ASCII view

![File Analyzer Hex](docs/screenshots/file-analyzer-hex.png)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS, shadcn/ui, Recharts, wouter |
| **Backend** | Node.js 24, Express 5, TypeScript |
| **Database** | PostgreSQL + Drizzle ORM |
| **Validation** | Zod v4 + drizzle-zod |
| **API Contract** | OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas) |
| **File Analysis** | Node.js crypto (MD5/SHA256), custom entropy / strings / hex engine |
| **Testing** | Vitest, Playwright |
| **CI/CD** | GitHub Actions |

---

## 🏗 Architecture

```
├── artifacts/
│   ├── apexplorer/        # React + Vite frontend  (port 5173)
│   └── api-server/        # Express API server     (port 8080)
├── lib/
│   ├── api-spec/          # OpenAPI spec (source of truth)
│   ├── api-client-react/  # Generated React Query hooks
│   ├── api-zod/           # Generated Zod schemas (backend validation)
│   └── db/                # Drizzle schema + migrations
└── scripts/               # Utility scripts
```

> **Contract-first workflow:** Edit `lib/api-spec/openapi.yaml` → run codegen → frontend hooks and backend validators are auto-generated.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Setup

```bash
# Clone the repository
git clone https://github.com/Alleyaaa/apexplorer.git
cd apexplorer

# Install dependencies
pnpm install

# Set your database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/apexplorer"

# Push database schema
pnpm --filter @workspace/db run push

# Regenerate API hooks (run after any OpenAPI spec changes)
pnpm --filter @workspace/api-spec run codegen
```

### Run Development

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5173)
pnpm --filter @workspace/apexplorer run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. 🎉

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `PORT` | ❌ | `8080` | API server port |
| `VITE_API_URL` | ❌ | `http://localhost:8080` | Frontend API base URL |
| `NODE_ENV` | ❌ | `development` | Environment mode |

---

## 📚 API Documentation

**Base URL:** `http://localhost:8080/api/v1`

### Collections

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/collections` | List all collections |
| `POST` | `/collections` | Create new collection |
| `GET` | `/collections/:id` | Get collection by ID |
| `PUT` | `/collections/:id` | Update collection |
| `DELETE` | `/collections/:id` | Delete collection |

### Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/requests` | List all saved requests |
| `POST` | `/requests` | Save new request |
| `GET` | `/requests/:id` | Get request by ID |
| `PUT` | `/requests/:id` | Update request |
| `DELETE` | `/requests/:id` | Delete request |
| `POST` | `/requests/:id/execute` | Execute saved request |

### File Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | Upload and analyze a file |
| `GET` | `/analyze/:id` | Get analysis results |
| `GET` | `/analyze/:id/download` | Download original file |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stats` | Get dashboard statistics |
| `GET` | `/stats/methods` | HTTP method breakdown |
| `GET` | `/stats/codes` | Status code distribution |

### Example

```bash
curl -X POST http://localhost:8080/api/v1/analyze \
  -H "Content-Type: multipart/form-data" \
  -F "file=@suspicious.exe"
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "suspicious.exe",
  "size": 2457600,
  "hashes": {
    "md5": "d41d8cd98f00b204e9800998ecf8427e",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "entropy": 7.89,
  "mimeType": "application/x-dosexec",
  "suspicious": true,
  "flags": ["HIGH_ENTROPY", "PE_BINARY", "SUSPICIOUS_STRINGS"],
  "strings": ["CreateRemoteThread", "VirtualAllocEx", "WriteProcessMemory"],
  "hexDump": "4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00...",
  "createdAt": "2026-05-23T14:00:00Z"
}
```

---

## 🔬 File Analysis

### Capabilities

| Feature | Details |
|---------|---------|
| **Hashing** | MD5, SHA-256 |
| **Entropy** | Shannon entropy (0–8 scale) |
| **MIME Detection** | Magic byte signatures for 12+ file types |
| **String Extraction** | Printable ASCII strings (min length 4), up to 500 results |
| **Hex Dump** | First 256 bytes, formatted with address + ASCII view |
| **Suspicious Flags** | High entropy, PE/ELF binaries, dangerous string patterns |

### Suspicious Indicators

| Flag | Description | Risk |
|------|-------------|------|
| `HIGH_ENTROPY` | Entropy > 7.5 — likely packed or encrypted | 🔴 High |
| `PE_BINARY` | Windows executable detected | 🟡 Medium |
| `ELF_BINARY` | Linux executable detected | 🟡 Medium |
| `SUSPICIOUS_STRINGS` | Dangerous API calls found in strings | 🔴 High |
| `NETWORK_IOCS` | URLs or IPs found in extracted strings | 🔴 High |
| `SHELLCODE_PATTERN` | Known shellcode signatures detected | 🔴 High |

---

## 🔒 Security

### File Analysis Safety

- **No execution** — All analysis is fully static (read-only)
- **Sandboxed processing** — Files analyzed in isolated memory
- **Auto-cleanup** — Temporary files deleted after analysis
- **Size limits** — Max 50 MB per file upload

### API Security

- Input validation via **Zod** schemas
- SQL injection prevention via **Drizzle ORM** parameterized queries
- **CORS** configured for production domains

### Production Best Practices

```bash
NODE_ENV=production pnpm start
DATABASE_URL="postgresql://strong_user:strong_password@localhost:5432/apexplorer"
# Set up nginx / traefik with SSL for HTTPS
```

---

## 🚢 Deployment

### 🐳 Docker (Recommended)

```bash
docker-compose up -d
# Frontend  → http://localhost:5173
# API       → http://localhost:8080
# PostgreSQL → localhost:5432
```

### ▲ Vercel (Frontend Only)

```bash
npm i -g vercel
cd artifacts/apexplorer
vercel --prod
```

### 🚂 Railway / Render (Full Stack)

1. Connect your GitHub repo to Railway or Render
2. Set environment variables (`DATABASE_URL`, `PORT`)
3. Push to `main` — deploys automatically

### 🖥 Manual Server

```bash
pnpm --filter @workspace/apexplorer run build
pnpm --filter @workspace/api-server run build

NODE_ENV=production \
  DATABASE_URL="postgresql://..." \
  pnpm --filter @workspace/api-server start
```

---

## 🤝 Contributing

Contributions are welcome! 🎉

```bash
git checkout -b feature/amazing-feature
git commit -m 'feat: add amazing feature'
git push origin feature/amazing-feature
# Then open a Pull Request
```

### Commit Convention

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style / formatting |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |

---

## 📝 Changelog

### [1.0.0] — 2026-05-23

**Added**
- ✨ Initial release with full API Explorer
- 🔐 File Analyzer — entropy, hashing, strings, hex dump
- 📁 Collections management
- 📊 Dashboard with stats and charts
- 🐳 Docker support

**Security**
- Static file analysis (no execution)
- Input validation via Zod
- File size limits on uploads

---

## 🙏 Acknowledgments

[React](https://react.dev) · [Vite](https://vitejs.dev) · [Tailwind CSS](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) · [Express](https://expressjs.com) · [Drizzle ORM](https://orm.drizzle.team) · [Zod](https://zod.dev) · [Orval](https://orval.dev) · [Recharts](https://recharts.org) · [PostgreSQL](https://postgresql.org)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [Alleyaaa](https://github.com/Alleyaaa)

⭐ **Star this repo if you find it useful!**

![footer](https://capsule-render.vercel.app/api?type=waving&color=0:00FF41,100:0d1117&height=100&section=footer)

</div>
