# Music Tracker

Full-stack web application that connects to **Spotify** and **Last.fm** to build a personalized music profile dashboard with AI-powered analysis. Users authenticate via Spotify OAuth, view their top tracks and artists enriched with Last.fm metadata, and receive an AI-generated personality profile of their music taste.

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Fastify 5** | HTTP framework with built-in validation and logging (pino) |
| **Prisma 7** | ORM with PostgreSQL driver adapter (`@prisma/adapter-pg`) |
| **PostgreSQL 17** | Primary relational database |
| **Redis 7** | Session tokens, CSRF state, analysis cache |
| **Zod 4** | Runtime validation for external API responses |
| **Axios** | HTTP client for Spotify and Last.fm APIs |
| **AES-256-GCM** | Symmetric encryption for OAuth tokens at rest |
| **Claude (Anthropic)** | AI-powered musical profile analysis |

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **Vite 8** | Build tool and dev server |
| **TypeScript 6** | Type safety |
| **Axios** | HTTP client with credential forwarding |
| **Lucide React** | Icon set |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker** | Multi-stage build for backend |
| **Docker Compose** | Local PostgreSQL + Redis orchestration |
| **Railway** | Backend hosting (with managed PostgreSQL and Redis) |
| **Vercel** | Frontend hosting with reverse-proxy rewrites to backend |

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              Prisma schema (PostgreSQL)
│   │   └── migrations/                SQL migration history
│   ├── prisma.config.ts               Prisma 7 config (datasource URL)
│   ├── Dockerfile                     Multi-stage production build
│   ├── docker-compose.yml             Local Postgres + Redis
│   └── src/
│       ├── app.ts                     Fastify instance setup
│       ├── server.ts                  Entrypoint with graceful shutdown
│       ├── config/
│       │   ├── env.ts                 Safe env var loader (fail-fast)
│       │   ├── prisma.ts              PrismaClient with PrismaPg adapter
│       │   ├── redis.ts               ioredis singleton
│       │   ├── spotify.ts             Spotify credentials & scopes
│       │   └── cookie.ts              Cookie options (secure in prod)
│       ├── schemas/
│       │   ├── spotify.schema.ts      Zod schemas for Spotify API
│       │   ├── lastfm.schema.ts       Zod schema for Last.fm API
│       │   ├── analysis.schema.ts     Zod schema for Claude response
│       │   └── route.schemas.ts       JSON Schema for Fastify validation
│       ├── repositories/
│       │   └── user.repository.ts     User CRUD (Prisma)
│       ├── services/
│       │   ├── auth.services.ts       OAuth flow, CSRF, token exchange
│       │   ├── spotify.services.ts    Spotify API calls with retry
│       │   ├── lastfm.services.ts     Last.fm artist data
│       │   ├── artist.services.ts     Spotify + Last.fm enrichment
│       │   └── claude.services.ts     AI musical analysis
│       ├── controllers/
│       │   ├── auth.controller.ts     Login, callback, session, logout
│       │   ├── spotify.controller.ts  Top tracks, artists, profile
│       │   └── analysis.controller.ts AI analysis with caching
│       ├── middlewares/
│       │   ├── auth.middleware.ts      Session validation & token inject
│       │   └── error.middleware.ts     Centralized error handler
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── spotify.routes.ts
│       │   └── analysis.routes.ts
│       ├── errors/
│       │   ├── DefaultError.ts        Base error (500)
│       │   ├── BadRequest.ts          (400)
│       │   ├── Unauthorized.ts        (401)
│       │   ├── NotFound.ts            (404)
│       │   └── BadGateway.ts          (502)
│       └── utils/
│           ├── crypto.ts              AES-256-GCM encrypt/decrypt
│           └── popularity.ts          Popularity score calculation
├── frontend/
│   ├── vercel.json                    Reverse-proxy rewrites
│   ├── index.html
│   └── src/
│       ├── App.tsx                    Minimal pathname router
│       ├── main.tsx                   React entrypoint
│       ├── hooks/
│       │   └── useSpotifyData.ts      Data fetching hook
│       └── pages/
│           ├── Home.tsx               Dashboard (login, loading, card)
│           ├── Home.module.css        Dashboard styles
│           └── Callback.tsx           OAuth token exchange page
└── README.md
```

## Prerequisites

- **Node.js** ≥ 18
- **Docker** and **Docker Compose** (for local database services)
- [Spotify Developer](https://developer.spotify.com/dashboard) account
- [Last.fm API](https://www.last.fm/api/account/create) key
- [Anthropic](https://console.anthropic.com/) API key

## Local Development Setup

### 1. Start database services

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL on port `5433` and Redis on port `6380` (non-default ports to avoid conflicts with local instances).

### 2. Configure environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and fill in all values (see Environment Variables below)

# Frontend
cd ../frontend
cp .env.example .env
```

### 3. Install dependencies and run migrations

```bash
# Backend
cd backend
npm install
npx prisma migrate dev

# Frontend
cd ../frontend
npm install
```

### 4. Start development servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Backend runs on `http://127.0.0.1:3333`, frontend on `http://localhost:5173`.

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SPOTIFY_CLIENT_ID` | Spotify app Client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app Client Secret |
| `SPOTIFY_REDIRECT_URI` | OAuth callback URL |
| `FRONTEND_URL` | Frontend origin (for CORS and redirects) |
| `COOKIE_SECRET` | Secret for signing cookies |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM |
| `LASTFM_API_KEY` | Last.fm API key |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) API key |
| `PORT` | Server port (default: `3333`) |
| `NODE_ENV` | `development` or `production` |

> Generate secrets:
> ```bash
> # ENCRYPTION_KEY (32 bytes = 64 hex chars)
> openssl rand -hex 32
>
> # COOKIE_SECRET
> openssl rand -hex 32
> ```

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL for development (e.g. `http://127.0.0.1:3333`). **Leave unset in production** — Vercel rewrites handle routing. |

## Scripts

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon + ts-node (hot reload) |
| `npm run build` | `prisma generate` + `tsc` |
| `npm start` | Run compiled `dist/server.js` |
| `npm run db:migrate` | Run pending migrations (production) |
| `npm run db:push` | Push schema directly (development) |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + Vite build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## API Endpoints

### Auth

| Method | Route | Description |
|---|---|---|
| `GET` | `/auth/login` | Redirects to Spotify OAuth consent screen |
| `GET` | `/auth/callback` | Spotify OAuth callback — exchanges code, creates user, redirects with one-time token |
| `GET` | `/auth/session?token=xxx` | Exchanges one-time token for a signed `user_id` cookie |
| `GET` | `/auth/logout` | Clears session cookie |

### Spotify Data (requires authentication)

| Method | Route | Query Params | Description |
|---|---|---|---|
| `GET` | `/me/profile` | — | Current user's display name and avatar |
| `GET` | `/me/top-tracks` | `limit` (1–50), `time_range` | Top tracks from Spotify |
| `GET` | `/me/top-artists` | `limit` (1–50), `time_range` | Top artists enriched with Last.fm data |
| `GET` | `/me/analysis` | — | AI-generated musical personality profile (cached 24h) |

`time_range` values: `short_term` (4 weeks), `medium_term` (6 months), `long_term` (all time).

### Health

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check (database + Redis connectivity) |

## Authentication Flow

The authentication uses a **token exchange pattern** designed for cross-domain deployments (e.g., Vercel frontend + Railway backend behind a reverse proxy):

```
┌──────────┐     ┌──────────┐     ┌─────────┐     ┌───────┐
│  Browser │     │  Vercel  │     │ Railway │     │Spotify│
│(Frontend)│     │ (Proxy)  │     │(Backend)│     │  API  │
└────┬─────┘     └────┬─────┘     └────┬────┘     └───┬───┘
     │                │                │               │
     │  GET /auth/login               │               │
     │───────────────►│───────────────►│               │
     │                │                │               │
     │                │  Generate CSRF state           │
     │                │  Store in Redis (10 min TTL)   │
     │                │                │               │
     │  302 → Spotify authorize       │               │
     │◄───────────────│◄──────────────│               │
     │                │                │               │
     │  User grants consent            │               │
     │────────────────────────────────────────────────►│
     │                │                │               │
     │  302 → /auth/callback?code=xxx&state=yyy       │
     │◄────────────────────────────────────────────────│
     │───────────────►│───────────────►│               │
     │                │                │               │
     │                │  Validate CSRF (consume from Redis)
     │                │  Exchange code for tokens      │
     │                │                │──────────────►│
     │                │                │◄──────────────│
     │                │  Encrypt tokens (AES-256-GCM)  │
     │                │  Upsert user in database       │
     │                │  Save one-time token in Redis (60s TTL)
     │                │                │               │
     │  302 → /callback?token=abc      │               │
     │◄───────────────│◄──────────────│               │
     │                │                │               │
     │  GET /auth/session?token=abc    │               │
     │───────────────►│───────────────►│               │
     │                │                │               │
     │                │  Consume token from Redis      │
     │                │  Set signed user_id cookie     │
     │                │                │               │
     │  200 { ok: true } + Set-Cookie  │               │
     │◄───────────────│◄──────────────│               │
     │                │                │               │
     │  Redirect to / (authenticated)  │               │
     │                │                │               │
```

Key security properties:
- **CSRF state** is stored in Redis and consumed on use (single-use, 10 min TTL)
- **One-time auth token** prevents replay attacks (single-use, 60 sec TTL)
- **OAuth tokens** are encrypted at rest with AES-256-GCM before database storage
- **Session cookie** is `httpOnly`, `signed`, `secure` (in production), `sameSite: lax`
- **Token refresh** is transparent — expired access tokens are refreshed automatically using the stored refresh token

## Response Formats

### Top Artists

```json
{
  "artists": [
    {
      "id": "spotify-id",
      "name": "Artist Name",
      "image": "https://...",
      "genres": ["rock", "alternative"],
      "popularity": 85,
      "similarArtists": [
        { "name": "Similar Artist", "image": "https://..." }
      ]
    }
  ]
}
```

### AI Analysis

```json
{
  "analysis": {
    "stats": {
      "energy": 72,
      "valence": 45,
      "danceability": 68
    },
    "persona": "Short humorous description of the user's music taste",
    "analysis": {
      "main_genres": ["indie rock", "alternative", "post-punk"],
      "mood": "Melancholic with bursts of energy",
      "listener_type": "alternativo",
      "summary": "Technical summary of listening patterns"
    }
  }
}
```

### Errors

```json
{ "error": "Error message", "status": 400 }
```

Error hierarchy:

```
DefaultError (500)
├── BadRequest (400)
├── Unauthorized (401)
├── NotFound (404)
└── BadGateway (502)
```

## Production Deployment

### Backend (Railway)

1. Connect your GitHub repository to Railway
2. Set the **root directory** to `backend`
3. Add a **PostgreSQL** and **Redis** service
4. Configure environment variables (all from the table above)
5. Set the **build command** to `npm run build` and **start command** to `node dist/server.js`
6. Set **pre-deploy command** to `npx prisma migrate deploy`

Key Railway variables:
- `NODE_ENV=production`
- `FRONTEND_URL=https://your-app.vercel.app`
- `SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/auth/callback`

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the **root directory** to `frontend`
3. **Do not** set `VITE_API_URL` — leave it unset so the frontend uses relative paths
4. Vercel rewrites in `vercel.json` proxy `/auth/*`, `/me/*`, and `/health` to the Railway backend

### Spotify Dashboard

Set the redirect URI to match your production frontend:
```
https://your-app.vercel.app/auth/callback
```

## Docker

### Build and run locally

```bash
cd backend

# Start Postgres + Redis
docker compose up -d

# Build the backend image
docker build -t music-tracker-backend .

# Run
docker run --rm \
  --env-file .env \
  --network host \
  music-tracker-backend
```

### Dockerfile overview

Multi-stage build:
1. **Builder stage**: `npm ci` → `prisma generate` → `tsc`
2. **Production stage**: `npm ci --omit=dev` → copies `dist/` and `.prisma` client

## Database Schema

```prisma
model User {
  id             String   @id @default(uuid())
  spotifyId      String   @unique
  displayName    String
  email          String?
  avatarUrl      String?
  accessToken    String            // AES-256-GCM encrypted
  refreshToken   String            // AES-256-GCM encrypted
  tokenExpiresAt DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Fastify over Express

**Status:** Accepted

**Context:** The project needed an HTTP framework for a Node.js REST API that handles OAuth flows, cookie management, and JSON responses.

**Decision:** Use Fastify 5 instead of Express.

**Rationale:**
- Built-in JSON Schema validation on routes (`schema` option) eliminates separate validation middleware
- Native structured logging via pino (production-ready, JSON output, log redaction)
- First-class TypeScript support with typed request/reply generics
- Plugin system with encapsulation (`register`) for clean route grouping
- Built-in `trustProxy` support essential for reverse-proxy deployments
- Ecosystem plugins (`@fastify/cors`, `@fastify/cookie`, `@fastify/helmet`, `@fastify/rate-limit`) are maintained by the core team

**Consequences:** Smaller middleware ecosystem than Express, but all required functionality is covered by official plugins.

---

### ADR-002: PostgreSQL with Prisma 7 Driver Adapters

**Status:** Accepted (migrated from SQLite)

**Context:** The application initially used SQLite for simplicity. Moving to production required a proper database that supports concurrent connections and is available as a managed service.

**Decision:** Migrate to PostgreSQL 17 using Prisma 7 with the `@prisma/adapter-pg` driver adapter.

**Rationale:**
- PostgreSQL is the standard for production web applications and is natively available on Railway, Heroku, Render, etc.
- Prisma 7 dropped the built-in database drivers in favor of driver adapters, making `@prisma/adapter-pg` mandatory
- The `pg` package gives direct control over the connection pool if needed
- `prisma.config.ts` replaces the `url` field in `schema.prisma`, allowing dynamic configuration via `env('DATABASE_URL')`

**Consequences:**
- `schema.prisma` has no `url` field — the datasource URL lives in `prisma.config.ts`
- `PrismaClient` must be instantiated with `{ adapter: new PrismaPg(...) }`
- Build process requires a dummy `DATABASE_URL` for `prisma generate` (handled in Dockerfile via `ARG`)

---

### ADR-003: Redis for Ephemeral State

**Status:** Accepted

**Context:** The application needs to store short-lived data: CSRF tokens (10 min), one-time auth tokens (60 sec), and AI analysis cache (24h). Storing these in PostgreSQL would be wasteful and require manual cleanup.

**Decision:** Use Redis (via ioredis) for all ephemeral/transient state.

**Rationale:**
- Native TTL support (`SET key value EX seconds`) eliminates the need for cleanup jobs
- Atomic `DEL` returns the number of keys deleted, enabling single-use token semantics without race conditions
- Sub-millisecond reads for cache hits on the analysis endpoint
- ioredis provides automatic reconnection and cluster support if needed later

**Trade-offs:**
- Additional infrastructure dependency (mitigated by Railway/managed Redis)
- Analysis cache is lost on Redis restart (acceptable — it regenerates on next request)

---

### ADR-004: Token Exchange Pattern for Cross-Domain Auth

**Status:** Accepted

**Context:** The frontend is hosted on Vercel (`*.vercel.app`) and the backend on Railway (`*.railway.app`). Vercel rewrites proxy API requests to make them same-origin, but `Set-Cookie` headers on `302` redirect responses are unreliably forwarded through the proxy layer.

**Decision:** Implement a one-time token exchange pattern instead of setting cookies directly in the OAuth callback redirect.

**Rationale:**
- The OAuth callback (`/auth/callback`) generates a cryptographically random one-time token, stores it in Redis with a 60-second TTL, and redirects the browser to `/callback?token=xxx`
- The frontend `/callback` page reads the token from the URL and makes an AJAX `GET /auth/session?token=xxx` request
- The session endpoint consumes the token (single-use via `redis.del`) and returns a `200` response with `Set-Cookie` — which the proxy forwards reliably
- This avoids `sameSite: 'none'` and third-party cookie issues entirely

**Alternatives considered:**
- `sameSite: 'none'` cookies — requires `Secure`, adds third-party cookie concerns, and was still dropped by the proxy on redirects
- Backend and frontend on the same domain — not feasible with Vercel + Railway free tiers
- Cookie set directly in the `302` response — unreliably forwarded by Vercel's rewrite proxy

**Consequences:**
- Requires a dedicated `/callback` page in the frontend
- One-time tokens add a Redis round-trip but improve security (no replay attacks)

---

### ADR-005: AES-256-GCM for Token Encryption at Rest

**Status:** Accepted

**Context:** Spotify OAuth access and refresh tokens must be stored in the database. If the database is compromised, these tokens grant full access to user Spotify accounts.

**Decision:** Encrypt all OAuth tokens with AES-256-GCM before storage. Decrypt only when making API calls.

**Rationale:**
- AES-256-GCM provides both confidentiality and authenticity (authenticated encryption)
- Each encryption uses a random 12-byte IV, preventing identical-plaintext attacks
- The auth tag ensures tamper detection — any modification invalidates the ciphertext
- Storage format `iv:tag:ciphertext` (hex-encoded) is self-contained and doesn't require separate IV/tag columns

**Consequences:**
- `ENCRYPTION_KEY` must be kept secure and backed up — losing it means all stored tokens become unreadable
- Key rotation requires re-encrypting all stored tokens (not currently implemented)
- Small CPU overhead per encrypt/decrypt (negligible for this use case)

---

### ADR-006: CSRF Protection via Redis State

**Status:** Accepted

**Context:** The Spotify OAuth flow uses a `state` parameter to prevent CSRF attacks. The state must be validated when Spotify redirects back.

**Decision:** Store the CSRF state in Redis with a 10-minute TTL and consume it atomically on callback.

**Rationale:**
- Redis `SET ... EX 600` automatically expires stale states without cleanup
- `DEL` returns `1` only if the key existed, providing atomic single-use validation without race conditions
- Eliminates cookie-based CSRF state, which was problematic with cross-domain proxies (cookies on redirect responses were being dropped)

**Alternatives considered:**
- Signed cookie with CSRF state — failed because cookies set in the login `302` redirect were not reliably forwarded through the Vercel proxy
- Database-stored state — unnecessary overhead for a 10-minute-lived value

---

### ADR-007: AI-Powered Analysis with Claude

**Status:** Accepted

**Context:** The application aims to provide a Spotify Wrapped-like experience with personality insights based on listening data.

**Decision:** Use Anthropic's Claude API to generate a structured musical profile analysis, with Zod validation on the response and Redis caching.

**Rationale:**
- Claude produces high-quality, structured JSON responses when given a detailed system prompt
- Zod schema (`AnalysisResponseSchema`) validates the AI output at runtime, ensuring type safety
- Redis caching (24h TTL) prevents redundant API calls and reduces cost
- The analysis endpoint has a stricter rate limit (5 req/min vs. 50 req/min global) to control API costs

**Consequences:**
- Requires an Anthropic API key and incurs per-request costs
- AI output quality depends on the system prompt (currently tuned for Portuguese personality descriptions)
- If the AI returns malformed JSON, the Zod parse throws and the request returns a `502`

---

### ADR-008: Vercel Rewrites as Reverse Proxy

**Status:** Accepted

**Context:** The frontend (Vercel) and backend (Railway) are on different domains. Browser security policies restrict cross-origin cookies and CORS adds complexity.

**Decision:** Use Vercel's `rewrites` in `vercel.json` to proxy API requests from the frontend domain to the backend.

**Rationale:**
- All API requests appear same-origin from the browser's perspective (`your-app.vercel.app/auth/*` → Railway backend)
- `sameSite: 'lax'` cookies work because the browser sees a same-origin response
- No CORS preflight requests for proxied endpoints
- Zero additional infrastructure — just a `vercel.json` configuration file
- SPA fallback (`/callback` → `/index.html`) is handled in the same config

**Consequences:**
- Vercel rewrites add a small latency hop (Vercel → Railway)
- `VITE_API_URL` must be unset in production (empty string = relative paths)
- The backend's `CORS origin` must include the Vercel domain
- The `SPOTIFY_REDIRECT_URI` must point to the Vercel domain (not Railway) so the proxy handles the callback

---

### ADR-009: Zod for External API Validation

**Status:** Accepted

**Context:** The application integrates with three external APIs (Spotify, Last.fm, Claude). Their responses could change format or contain unexpected data.

**Decision:** Validate every external API response with Zod schemas before use.

**Rationale:**
- Runtime type safety at the system boundary — if Spotify changes their API, the app fails fast with a clear Zod parse error instead of undefined property errors deep in business logic
- Inferred TypeScript types from schemas (`z.infer<typeof Schema>`) keep types and validation in sync
- Zod 4's `.parse()` strips unknown properties, preventing accidental leakage of unnecessary data

**Consequences:**
- Every external API integration requires maintaining a corresponding Zod schema
- Parse errors surface as unhandled exceptions (caught by the error middleware and returned as 500/502)

---

### ADR-010: Monorepo with Independent Deployments

**Status:** Accepted

**Context:** The project has a React frontend and a Fastify backend. They need to be deployed to different platforms (Vercel and Railway).

**Decision:** Structure as a monorepo with `backend/` and `frontend/` top-level directories, each with their own `package.json`, deploying independently.

**Rationale:**
- Single repository for atomic commits across frontend and backend changes
- Each platform (Vercel, Railway) points to its respective root directory
- No shared code or build dependencies between frontend and backend
- No monorepo tooling overhead (no Turborepo, Nx, or workspaces needed)

**Consequences:**
- No shared TypeScript types between frontend and backend (duplicated interfaces in `useSpotifyData.ts`)
- CI/CD must be configured per-directory if added later

---

### ADR-011: Spotify API Retry with Exponential Backoff

**Status:** Accepted

**Context:** The Spotify API enforces rate limits (HTTP 429) with a `Retry-After` header. Multiple endpoints are called in parallel (top tracks, top artists, profile), increasing the chance of hitting limits.

**Decision:** Wrap all Spotify API calls in a `spotifyApiRequest` helper that retries on 429 responses with exponential backoff.

**Rationale:**
- Spotify's `Retry-After` header tells exactly how long to wait
- Exponential backoff (`Math.pow(2, attempt)` seconds) as a floor prevents tight retry loops
- Maximum 3 retries prevents infinite loops on persistent rate limiting
- Non-429 errors are thrown immediately without retry

**Consequences:**
- Requests may take longer under rate limiting, but the 60-second `requestTimeout` on Fastify caps total wait time
- The `Promise.allSettled` pattern in `artist.services.ts` ensures partial results are still returned if some Last.fm enrichments fail
