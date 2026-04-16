# Music Tracker — Backend

REST API built with **Fastify** that integrates data from **Spotify** and **Last.fm** to track and enrich the user's music profile.

## Tech Stack

| Technology | Purpose |
|---|---|
| **Fastify** | HTTP framework |
| **Prisma** + **SQLite** | ORM and local database |
| **Zod** | External API response validation |
| **Axios** | HTTP client for Spotify and Last.fm |
| **AES-256-GCM** | OAuth token encryption |

## Project Structure

```
src/
├── config/                 # Centralized configuration
│   ├── env.ts                  Safe env var loader
│   ├── prisma.ts               Prisma Client instance
│   ├── spotify.ts              Spotify credentials & scopes
│   └── cookie.ts               Cookie options
├── schemas/                # Zod schemas & inferred types
│   ├── spotify.schema.ts       Spotify API schemas
│   └── lastfm.schema.ts        Last.fm API schemas
├── repositories/           # Data access layer (Prisma)
│   └── user.repository.ts      User CRUD operations
├── services/               # Business logic & external APIs
│   ├── auth.services.ts        OAuth flow, CSRF, token refresh
│   ├── spotify.services.ts     All Spotify API calls
│   ├── lastfm.services.ts      Last.fm artist data
│   └── artist.services.ts      Spotify + Last.fm aggregation
├── controllers/            # Route handlers
│   ├── auth.controller.ts
│   └── spotify.controller.ts
├── middlewares/
│   ├── auth.middleware.ts       Session validation & token injection
│   └── error.middleware.ts      Centralized error handler
├── routes/
│   ├── auth.routes.ts
│   └── spotify.routes.ts
├── errors/                 # Custom error hierarchy
│   ├── DefaultError.ts         (500)
│   ├── BadRequest.ts           (400)
│   ├── NotFound.ts             (404)
│   └── BadGateway.ts           (502)
├── utils/                  # Pure utility functions
│   ├── crypto.ts               AES-256-GCM encrypt/decrypt
│   └── popularity.ts           Popularity score calculation
├── app.ts                  # Fastify setup
└── server.ts               # Entrypoint
```

## Prerequisites

- Node.js ≥ 18
- [Spotify Developer](https://developer.spotify.com/dashboard) account
- [Last.fm](https://www.last.fm/api/account/create) API key

## Setup

```bash
# Install dependencies
npm install

# Create .env from the example
cp .env.example .env

# Run Prisma migrations
npx prisma migrate dev

# Start in development mode
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify app Client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app Client Secret |
| `SPOTIFY_REDIRECT_URI` | OAuth callback URI (e.g. `http://127.0.0.1:3333/auth/callback`) |
| `FRONTEND_URL` | Frontend URL (e.g. `http://localhost:5173`) |
| `COOKIE_SECRET` | Secret for signing cookies |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM |
| `LASTFM_API_KEY` | Last.fm API key |
| `PORT` | Server port (default: `3333`) |

> Generate `ENCRYPTION_KEY` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon + ts-node (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the production build |

## Endpoints

### Auth

| Method | Route | Description |
|---|---|---|
| `GET` | `/auth/login` | Redirects to Spotify OAuth |
| `GET` | `/auth/callback` | OAuth callback — creates/updates user |
| `POST` | `/auth/logout` | Clears session cookie |

### Spotify Data

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/me/top-tracks` | Cookie `user_id` | User's top tracks |
| `GET` | `/me/top-artists` | Cookie `user_id` | User's top artists enriched with Last.fm data |

### Health

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check |

## Authentication Flow

1. Frontend redirects to `GET /auth/login`
2. Backend generates CSRF state, saves in signed cookie, redirects to Spotify
3. Spotify redirects to `GET /auth/callback` with `code`
4. Backend validates CSRF state, exchanges code for tokens, fetches profile
5. Tokens are encrypted (AES-256-GCM) and saved to database
6. Signed `user_id` cookie is set and redirects to frontend
7. Authenticated requests decrypt and use the access token
8. Expired tokens are automatically refreshed via refresh token

## Response Format — Top Artists

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

## Error Handling

Centralized custom error hierarchy with global handler:

```
DefaultError (500)
├── BadRequest (400)
├── NotFound (404)
└── BadGateway (502)
```

All error responses follow the format:

```json
{ "error": "message", "status": 400 }
```
