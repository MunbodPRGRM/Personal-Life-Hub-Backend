# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Server

```bash
node server.js
```

No build step required. Requires a `.env` file with MySQL credentials (see `.env` — already present, gitignored).

## Architecture

Express.js REST API backend for a personal life management app. Early scaffolding phase — the skeleton exists but `src/routes/` and `src/controllers/` are currently empty.

**Request flow:** `server.js` → `src/app.js` (mounts routes + error handler) → `src/routes/<feature>.js` (not yet created) → `src/controllers/<feature>.js` (not yet created) → `src/config/db.js` (mysql2 pool)

**Key files:**
- `server.js` — entry point, reads `PORT` from env (default 5000)
- `src/app.js` — Express app factory, declares all route prefixes
- `src/config/db.js` — shared mysql2 connection pool (`connectionLimit: 10`), imported directly by controllers
- `src/middlewares/errorHandler.js` — global error handler, returns `{ success: false, message }` JSON

## Planned API Routes

| Prefix | Feature |
|--------|---------|
| `/api/auth` | Authentication |
| `/api/todos` | Todos |
| `/api/events` | Calendar events |
| `/api/notes` | Notes |
| `/api/goals` | Goals |
| `/api/transactions` | Financial transactions |
| `/api/reminders` | Reminders |

## Key Conventions

- **CommonJS** (`require`/`module.exports`) — no ES modules
- **Express v5** — async errors propagate automatically to `next(err)` without try/catch wrappers
- New route files go in `src/routes/`, new controllers in `src/controllers/`
- DB queries use the pool from `src/config/db.js`: `const pool = require('../config/db'); pool.query(...)`
- Error responses follow `{ success: false, message }` shape (set by the error handler)
