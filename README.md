<div align="center">
<img src="https://raw.githubusercontent.com/Alleyaaa/apexplorer/main/attached_assets/logo.png" alt="APExplorer Logo" width="120" height="120">
🔍 APExplorer
API Explorer & Binary Analyzer
A developer and security research tool for reverse-engineering APIs and performing static file analysis.
https://opensource.org/licenses/MIT
https://react.dev
https://typescriptlang.org
https://tailwindcss.com
https://expressjs.com
https://postgresql.org
https://docker.com
🚀 Live Demo · 📖 Documentation · 🐛 Report Bug · 💡 Request Feature
</div>
📑 Table of Contents
Features
Demo
Tech Stack
Architecture
Getting Started
API Documentation
File Analysis
Security
Deployment
Screenshots
Contributing
Changelog
Acknowledgments
License
✨ Features
🌐 API Explorer
Postman-like request builder with full HTTP client capabilities:
cURL Import — Paste any cURL command and auto-convert to request
Headers/Params/Body Editor — Intuitive form-based editor with JSON validation
Response Viewer — Syntax-highlighted JSON with collapsible tree view
Request History — Per-request history with timestamps and status codes
Environment Variables — Switch between dev/staging/prod configs
🔐 File Analyzer
Upload any file for instant security analysis:
Hashing — MD5 & SHA-256 checksums
Entropy Analysis — Shannon entropy (0–8 scale) to detect packed/encrypted data
MIME Detection — Magic byte signatures for 12+ file types
String Extraction — Printable ASCII strings (min length 4), up to 500 results
Hex Dump — First 256 bytes formatted with address + ASCII view
Suspicious Flags — Automatic detection of PE/ELF binaries, high entropy, and dangerous string patterns
📁 Collections
Organize saved requests into color-coded groups for better workflow management.
Create unlimited collections
Drag & drop reordering
Export/import as JSON
📊 Dashboard
Stats overview with:
HTTP method breakdown (GET, POST, PUT, DELETE, etc.)
Status code distribution charts
Recent activity feed
Quick stats cards
Response time analytics
🎥 Demo
<div align="center">
API Explorer in Action
plain
Copy
┌─────────────────────────────────────────────────────────────┐
│  GET  https://api.example.com/users                         │
├─────────────────────────────────────────────────────────────┤
│  Headers                    Body           Params           │
│  ─────────────────────────────────────────────────────────  │
│  Authorization: Bearer eyJhbG...                            │
│  Content-Type: application/json                             │
│                                                             │
│  {                                                          │
│    "page": 1,                                               │
│    "limit": 10                                              │
│  }                                                          │
├─────────────────────────────────────────────────────────────┤
│  Response: 200 OK  |  124ms  |  1.2 KB                      │
├─────────────────────────────────────────────────────────────┤
│  {                                                          │
│    "data": [                                                │
│      { "id": 1, "name": "Alice", "role": "admin" },         │
│      { "id": 2, "name": "Bob", "role": "user" }              │
│    ],                                                       │
│    "total": 2                                               │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
File Analyzer Results
plain
Copy
┌─────────────────────────────────────────────────────────────┐
│  File: suspicious.exe  |  Size: 2.4 MB                      │
├─────────────────────────────────────────────────────────────┤
│  ⚠️  SUSPICIOUS FILE DETECTED                               │
├─────────────────────────────────────────────────────────────┤
│  Hashes:                                                    │
│    MD5:    d41d8cd98f00b204e9800998ecf8427e                 │
│    SHA256: e3b0c44298fc1c149afbf4c8996fb924...              │
│                                                             │
│  Entropy: 7.89/8.00  🔴 HIGH (likely packed/encrypted)      │
│  MIME:    application/x-dosexec  🔴 PE Binary                │
│                                                             │
│  Suspicious Strings Found:                                  │
│    - "CreateRemoteThread"                                   │
│    - "VirtualAllocEx"                                       │
│    - "WriteProcessMemory"                                   │
│    - "http://evil-c2-server.com/payload"                    │
└─────────────────────────────────────────────────────────────┘
</div>
🛠 Tech Stack
Table
Layer	Technology
Frontend	React 19, Vite, Tailwind CSS, shadcn/ui, Recharts, wouter
Backend	Node.js 24, Express 5, TypeScript
Database	PostgreSQL + Drizzle ORM
Validation	Zod v4 + drizzle-zod
API Contract	OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas)
File Analysis	Node.js crypto (MD5/SHA256), custom entropy/strings/hex engine
Testing	Vitest, Playwright
CI/CD	GitHub Actions
🏗 Architecture
plain
Copy
├── artifacts/
│   ├── apexplorer/        # React + Vite frontend (port 5173)
│   └── api-server/        # Express API server (port 8080)
├── lib/
│   ├── api-spec/          # OpenAPI spec (source of truth)
│   ├── api-client-react/  # Generated React Query hooks
│   ├── api-zod/           # Generated Zod schemas (backend validation)
│   └── db/                # Drizzle schema + migrations
└── scripts/               # Utility scripts
Contract-first workflow: Edit lib/api-spec/openapi.yaml → run codegen → frontend hooks and backend validators are auto-generated.
🚀 Getting Started
Prerequisites
Node.js 20+
pnpm 9+
PostgreSQL database
Setup
bash
Copy
# Clone the repository
git clone https://github.com/Alleyaaa/apexplorer.git
cd apexplorer

# Install dependencies
pnpm install

# Set your database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/apexplorer"

# Push database schema
pnpm --filter @workspace/db run push

# Regenerate API hooks (if you change the OpenAPI spec)
pnpm --filter @workspace/api-spec run codegen
Run Development
bash
Copy
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5173)
pnpm --filter @workspace/apexplorer run dev
Open http://localhost:5173 in your browser.
Environment Variables
Table
Variable	Required	Default	Description
DATABASE_URL	✅	-	PostgreSQL connection string
PORT	❌	8080	API server port
VITE_API_URL	❌	http://localhost:8080	Frontend API base URL
NODE_ENV	❌	development	Environment mode
📚 API Documentation
Base URL
plain
Copy
http://localhost:8080/api/v1
Endpoints
Collections
Table
Method	Endpoint	Description
GET	/collections	List all collections
POST	/collections	Create new collection
GET	/collections/:id	Get collection by ID
PUT	/collections/:id	Update collection
DELETE	/collections/:id	Delete collection
Requests
Table
Method	Endpoint	Description
GET	/requests	List all saved requests
POST	/requests	Save new request
GET	/requests/:id	Get request by ID
PUT	/requests/:id	Update request
DELETE	/requests/:id	Delete request
POST	/requests/:id/execute	Execute saved request
File Analysis
Table
Method	Endpoint	Description
POST	/analyze	Upload and analyze file
GET	/analyze/:id	Get analysis results
GET	/analyze/:id/download	Download original file
Dashboard
Table
Method	Endpoint	Description
GET	/stats	Get dashboard statistics
GET	/stats/methods	HTTP method breakdown
GET	/stats/codes	Status code distribution
Example Request
bash
Copy
curl -X POST http://localhost:8080/api/v1/analyze \
  -H "Content-Type: multipart/form-data" \
  -F "file=@suspicious.exe"
Example Response
JSON
Copy
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
  "strings": [
    "CreateRemoteThread",
    "VirtualAllocEx",
    "WriteProcessMemory"
  ],
  "hexDump": "4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00...",
  "createdAt": "2026-05-23T14:00:00Z"
}
🔬 File Analysis
Capabilities
Table
Feature	Details
Hashing	MD5, SHA-256
Entropy	Shannon entropy (0–8 scale)
MIME Detection	Magic byte signatures for 12+ file types
String Extraction	Printable ASCII strings (min length 4), up to 500
Hex Dump	First 256 bytes, formatted with address + ASCII
Suspicious Flags	High entropy, PE/ELF binaries, dangerous string patterns
Suspicious Indicators
Table
Flag	Description	Risk Level
HIGH_ENTROPY	Entropy > 7.5 (likely packed/encrypted)	🔴 High
PE_BINARY	Windows executable detected	🟡 Medium
ELF_BINARY	Linux executable detected	🟡 Medium
SUSPICIOUS_STRINGS	Dangerous API calls found	🔴 High
NETWORK_IOCS	URLs/IPs in strings	🔴 High
SHELLCODE_PATTERN	Known shellcode signatures	🔴 High
🔒 Security
File Analysis Safety
No file execution — All analysis is static (read-only)
Sandboxed processing — Files analyzed in isolated memory
Auto-cleanup — Temporary files deleted after analysis
Size limits — Max 50MB per file upload
API Security
Input validation via Zod schemas
SQL injection prevention via Drizzle ORM parameterized queries
CORS configured for production domains
Best Practices
bash
Copy
# Run in production mode
NODE_ENV=production pnpm start

# Use strong database credentials
DATABASE_URL="postgresql://strong_user:strong_password@localhost:5432/apexplorer"

# Enable HTTPS in production
# Set up reverse proxy (nginx/traefik) with SSL
🚢 Deployment
Docker (Recommended)
bash
Copy
# Build and run with Docker Compose
docker-compose up -d

# Services:
# - Frontend: http://localhost:5173
# - API: http://localhost:8080
# - PostgreSQL: localhost:5432
Vercel (Frontend Only)
bash
Copy
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd artifacts/apexplorer
vercel --prod
Railway / Render (Full Stack)
Connect GitHub repo to Railway/Render
Set environment variables (DATABASE_URL, PORT)
Deploy automatically on push to main
Manual Server Deployment
bash
Copy
# Build production assets
pnpm --filter @workspace/apexplorer run build
pnpm --filter @workspace/api-server run build

# Start production server
NODE_ENV=production \
  DATABASE_URL="postgresql://..." \
  pnpm --filter @workspace/api-server start
📸 Screenshots
<div align="center">
Table
Dashboard	API Explorer
Stats, charts, recent activity	Request builder, cURL import, response viewer
Table
File Analyzer	Collections
Upload, hashes, strings, hex dump	Organized request groups
</div>
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'feat: add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
Commit Convention
Table
Prefix	Description
feat:	New feature
fix:	Bug fix
docs:	Documentation changes
style:	Code style changes (formatting)
refactor:	Code refactoring
test:	Adding/updating tests
chore:	Maintenance tasks
📝 Changelog
[1.0.0] - 2026-05-23
Added
✨ Initial release with API Explorer
🔐 File Analyzer with entropy, hashing, and suspicious detection
📁 Collections management
📊 Dashboard with stats and charts
🐳 Docker support
📖 Full API documentation
Security
Static file analysis (no execution)
Input validation via Zod
Size limits on uploads
🙏 Acknowledgments
React — UI library
Vite — Build tool
Tailwind CSS — Utility-first CSS
shadcn/ui — UI components
Express — Web framework
Drizzle ORM — Database ORM
Zod — Schema validation
Orval — API codegen
Recharts — Charts library
PostgreSQL — Database
📄 License
This project is licensed under the MIT License — see the LICENSE file for details.
<div align="center">
Made with ❤️ by Alleyaaa
⭐ Star this repo if you find it useful!
</div>
