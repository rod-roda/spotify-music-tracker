import { vi } from 'vitest';

process.env.ENCRYPTION_KEY = 'a'.repeat(64);
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SPOTIFY_CLIENT_ID = 'test_client_id';
process.env.SPOTIFY_CLIENT_SECRET = 'test_client_secret';
process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:3000/auth/callback';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.COOKIE_SECRET = 'test_cookie_secret_32_chars_long!!';
process.env.LASTFM_API_KEY = 'test_lastfm_key';
process.env.ANTHROPIC_API_KEY = 'test_anthropic_key';
process.env.NODE_ENV = 'test';

afterEach(() => {
    vi.restoreAllMocks();
});
