<div align="center">
  <h1>DocBot</h1>
  <p>AI-powered document intelligence - upload a file, get structured insights in seconds.</p>

  ![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs)
  ![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)
  ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
  ![Claude](https://img.shields.io/badge/Claude-Sonnet_4-D97706?style=flat-square)
  ![Jest](https://img.shields.io/badge/Jest-29-C21325?style=flat-square&logo=jest)
  ![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

  <br />

  [Live Demo](https://docbot.up.railway.app) · [Report Bug](https://github.com/YOUR_USERNAME/docbot/issues)
</div>

---

## What is DocBot?

DocBot is a full-stack document processing system that uses Claude AI to turn unstructured documents into structured, actionable data — automatically.

Upload a PDF, Word doc, or text file and DocBot extracts a summary, classifies the document type, pulls out every action item with who owns it and when it's due, and maps all key entities — people, organizations, amounts, dates — into a clean dashboard you can export to JSON or CSV.

Built to demonstrate practical LLM integration for enterprise AI developer roles.

---

## Features

**Document processing**
- Drag-and-drop upload for PDF, Word (.docx), and plain text
- Text extraction via `pdf-parse` and `mammoth` — no OCR dependency
- Files deleted from disk immediately after extraction — only text is stored

**AI extraction (Claude API)**
- Document classification — invoice, contract, report, email, memo, proposal
- Executive summary in 2–4 sentences
- Action item extraction — who, what, when, priority
- Entity mapping — people, organizations, dates, amounts, locations
- Confidence score per classification
- Structured JSON output enforced via prompt schema — Claude always returns parseable data

**Dashboard**
- Document library with search and type filtering
- Tabbed results view — Summary, Action Items, Entities, Raw Text
- One-click JSON and CSV export for workflow integration
- Processing animation with step-by-step status

**Engineering**
- Three-tier test suite — unit (mocked Claude), integration (real PostgreSQL), and API lifecycle
- GitHub Actions CI — all tests run on every push
- RESTful API with centralized error handling and file validation

---

## Architecture
```
docbot/
├── api/                          # Node.js + Express backend → Railway
│   └── src/
│       ├── db/                   # PostgreSQL schema + connection pool
│       ├── middleware/           # multer upload, error handler
│       ├── routes/               # documents router
│       ├── services/
│       │   ├── aiExtractor.js    # Claude API — structured JSON output
│       │   ├── documentProcessor.js  # pdf-parse + mammoth
│       │   └── documentService.js    # PostgreSQL CRUD
│       └── utils/
│           └── exportFormatter.js    # JSON + CSV export
└── client/                       # React + Vite frontend → Railway
└── src/
├── api/                  # Axios client
├── hooks/                # useDocuments — upload state + list
└── components/
├── Sidebar.jsx       # Document library + search
├── UploadZone.jsx    # Drag-and-drop with react-dropzone
├── ProcessingView.jsx  # Animated processing state
└── ResultsPanel.jsx  # Tabbed results + export
```
### Request flow
```
Browser (React + Vite)
↓
POST /api/documents/upload  [multipart/form-data]
↓
multer  →  disk storage  →  pdf-parse / mammoth
↓
Claude API  (claude-sonnet-4-20250514)
↓
PostgreSQL  [documents + results tables]
↓
JSON response  →  React dashboard
↓
GET /api/documents/:id/export?format=json|csv
```
---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 18, Vite, CSS Modules                     |
| Backend      | Node.js 20, Express 4                           |
| AI           | Claude API (claude-sonnet-4-20250514)           |
| Database     | PostgreSQL 16                                   |
| File parsing | pdf-parse, mammoth                              |
| File upload  | multer                                          |
| Testing      | Jest, Supertest                                 |
| CI/CD        | GitHub Actions                                  |
| Deployment   | Railway                                         |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/docbot.git
cd docbot

cd api && npm install
cd ../client && npm install
```

### 2. Set up the database

```bash
psql -U postgres -c "CREATE USER docbot WITH PASSWORD 'secret';"
psql -U postgres -c "CREATE DATABASE docbot OWNER docbot;"
psql -U postgres -c "CREATE DATABASE docbot_test OWNER docbot;"
psql postgres://docbot:secret@localhost:5432/docbot -f api/src/db/migrations.sql
```

### 3. Configure environment

```bash
cp api/.env.example api/.env
```

Fill in `api/.env`:

```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgres://docbot:secret@localhost:5432/docbot
ANTHROPIC_API_KEY=sk-ant-...
MAX_FILE_SIZE_MB=10
```

### 4. Run

```bash
# Terminal 1 — API
cd api && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001
- Health check: http://localhost:3001/health

---

## Running Tests

```bash
cd api

# Unit tests — no database needed, runs in ~0.3s
npm run test:unit

# Integration tests — requires Postgres running
npm run test:int

# All tests
npm test
```

### Test breakdown

**Unit tests** — Jest with mocked Anthropic SDK
- `aiExtractor.test.js` — Claude response parsing, JSON validation, default normalization, backtick stripping
- `exportFormatter.test.js` — JSON shape correctness, CSV structure, comma escaping in cells

**Integration tests** — Supertest against real PostgreSQL
- Full upload → extract → store → respond lifecycle
- GET list, GET by ID, export as JSON, export as CSV, DELETE
- Claude and file parser mocked — deterministic, fast, no API credits consumed

---

## API Reference

| Method | Endpoint                          | Description                           |
|--------|-----------------------------------|---------------------------------------|
| POST   | `/api/documents/upload`           | Upload and process a document         |
| GET    | `/api/documents`                  | List all processed documents          |
| GET    | `/api/documents/:id`              | Get full result for one document      |
| GET    | `/api/documents/:id/export`       | Download result as JSON or CSV        |
| DELETE | `/api/documents/:id`              | Delete a document and its result      |
| GET    | `/health`                         | Health check                          |

### POST /api/documents/upload

Accepts `multipart/form-data` with a `file` field. Returns:

```json
{
  "document": {
    "id": "uuid",
    "filename": "report.pdf",
    "fileType": "pdf",
    "fileSizeKb": 142,
    "uploadedAt": "2024-01-15T10:00:00Z"
  },
  "result": {
    "documentType": "report",
    "confidence": 0.95,
    "summary": "Quarterly sales report showing 15% revenue growth...",
    "keyPoints": ["Revenue up 15%", "Three new markets opened"],
    "actionItems": [
      { "who": "Sales team", "what": "Follow up on leads", "when": "Q1 2024", "priority": "high" }
    ],
    "entities": {
      "people": ["Jane Doe"],
      "organizations": ["Acme Corp"],
      "dates": ["Q4 2023"],
      "amounts": ["$2.4M"],
      "locations": ["Toronto"]
    },
    "processingMs": 1240
  }
}
```

---

## Key Design Decisions

**Structured LLM output**
The Claude prompt explicitly defines a JSON schema and instructs the model to return only valid JSON — no markdown, no preamble. A fallback strips backtick wrappers if Claude adds them anyway. This is a production pattern: constrain LLM output to a schema so downstream systems can always parse it reliably. It's directly analogous to function calling in OpenAI's API.

**`app.js` vs `server.js` separation**
The Express app is exported from `app.js` without calling `listen()`. Integration tests import `app.js` directly via Supertest — no port binding, no test conflicts, faster runs. `server.js` is the only file that starts the actual server.

**Mocked AI in tests**
Unit and integration tests never call the real Claude API. The Anthropic SDK is mocked at the module level so tests run in under 0.5 seconds, consume zero API credits, and produce deterministic results. This is the correct architecture for testing LLM-integrated systems — you test the integration code, not the model.

**File cleanup**
Uploaded files are deleted from disk immediately after text extraction. Only extracted text is stored in PostgreSQL — not the original binary. This keeps storage minimal and avoids handling sensitive document content longer than necessary.

**Export as JSON and CSV**
JSON export packages the full result into a versioned schema (`export_version: "1.0"`) so downstream consumers can detect breaking changes. CSV export includes all sections as labeled blocks rather than a flat table — making it readable in both spreadsheets and text editors.

---

## Deployment

### Railway (recommended — hosts API + Postgres together)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a PostgreSQL service → Railway auto-injects `DATABASE_URL`
4. Set environment variables:
NODE_ENV=production
ANTHROPIC_API_KEY=sk-ant-...
MAX_FILE_SIZE_MB=10
5. Set root directory to `api`, build command `npm install`, start command `node src/server.js`
6. Deploy — Railway gives you a live URL

---

## License

MIT © [Satvik Gahlot](https://github.com/BestBow)
