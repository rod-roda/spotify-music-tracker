import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../config/redis', () => ({
    redis: { get: vi.fn(), set: vi.fn(), del: vi.fn(), ping: vi.fn().mockResolvedValue('PONG') },
}));

vi.mock('../../config/prisma', () => ({
    prisma: { user: { findUniqueOrThrow: vi.fn(), update: vi.fn(), upsert: vi.fn() }, $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]) },
}));

vi.mock('../../services/auth.services', () => ({
    generateCSRFState: vi.fn().mockReturnValue('csrf_state_123'),
    saveCSRFState: vi.fn().mockResolvedValue(undefined),
    getAuthUrl: vi.fn().mockReturnValue('https://accounts.spotify.com/authorize?state=csrf_state_123'),
    consumeCSRFState: vi.fn(),
    upsertUser: vi.fn(),
    saveAuthToken: vi.fn().mockResolvedValue('auth_token_abc'),
    consumeAuthToken: vi.fn(),
}));

vi.mock('../../services/spotify.services', () => ({
    exchangeCode: vi.fn(),
    getSpotifyProfile: vi.fn(),
}));

import { buildApp } from '../../app';
import {
    consumeCSRFState,
    upsertUser,
    consumeAuthToken,
} from '../../services/auth.services';
import { exchangeCode, getSpotifyProfile } from '../../services/spotify.services';

const mockConsumeCSRFState = vi.mocked(consumeCSRFState);
const mockUpsertUser = vi.mocked(upsertUser);
const mockConsumeAuthToken = vi.mocked(consumeAuthToken);
const mockExchangeCode = vi.mocked(exchangeCode);
const mockGetSpotifyProfile = vi.mocked(getSpotifyProfile);

const app = buildApp();

beforeAll(async () => {
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

describe('GET /auth/login', () => {
    it('redirects to Spotify authorization URL', async () => {
        const response = await app.inject({ method: 'GET', url: '/auth/login' });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain('accounts.spotify.com/authorize');
    });
});

describe('GET /auth/callback', () => {
    it('returns 400 when code is missing', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/auth/callback?state=some_state&error=access_denied',
        });

        expect(response.statusCode).toBe(400);
    });

    it('returns 403 when CSRF state is invalid', async () => {
        mockConsumeCSRFState.mockResolvedValue(false);

        const response = await app.inject({
            method: 'GET',
            url: '/auth/callback?code=auth_code&state=bad_state',
        });

        expect(response.statusCode).toBe(403);
    });

    it('redirects to frontend with auth token on success', async () => {
        mockConsumeCSRFState.mockResolvedValue(true);
        mockExchangeCode.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref', expires_in: 3600 });
        mockGetSpotifyProfile.mockResolvedValue({ id: 'sp123', display_name: 'Test User' });
        mockUpsertUser.mockResolvedValue({ id: 'user-uuid' } as any);

        const response = await app.inject({
            method: 'GET',
            url: '/auth/callback?code=valid_code&state=valid_state',
        });

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain('token=auth_token_abc');
    });
});

describe('GET /auth/session', () => {
    it('returns 401 when token is invalid or expired', async () => {
        mockConsumeAuthToken.mockResolvedValue(null);

        const response = await app.inject({
            method: 'GET',
            url: '/auth/session?token=bad_token',
        });

        expect(response.statusCode).toBe(401);
    });

    it('sets user_id cookie and returns ok on valid token', async () => {
        mockConsumeAuthToken.mockResolvedValue('user-uuid');

        const response = await app.inject({
            method: 'GET',
            url: '/auth/session?token=valid_token',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.ok).toBe(true);
        expect(response.headers['set-cookie']).toBeDefined();
    });
});

describe('GET /auth/logout', () => {
    it('clears the cookie and returns 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/auth/logout' });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.message).toBe('Logged out successfully');
    });
});
