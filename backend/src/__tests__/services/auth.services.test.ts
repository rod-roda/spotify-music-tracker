import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/redis', () => ({
    redis: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
    },
}));

vi.mock('../../config/prisma', () => ({
    prisma: {
        user: {
            findUniqueOrThrow: vi.fn(),
            update: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

vi.mock('../../services/spotify.services', () => ({
    requestTokenRefresh: vi.fn(),
}));

import { redis } from '../../config/redis';
import { prisma } from '../../config/prisma';
import { requestTokenRefresh } from '../../services/spotify.services';
import {
    getAuthUrl,
    generateCSRFState,
    saveCSRFState,
    consumeCSRFState,
    saveAuthToken,
    consumeAuthToken,
    getValidAccessToken,
    upsertUser,
} from '../../services/auth.services';
import { encrypt } from '../../utils/crypto';

const mockRedis = vi.mocked(redis);
const mockPrisma = vi.mocked(prisma);
const mockRefresh = vi.mocked(requestTokenRefresh);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getAuthUrl', () => {
    it('returns a Spotify authorization URL containing the state', () => {
        const url = getAuthUrl('my_state_123');
        expect(url).toContain('https://accounts.spotify.com/authorize');
        expect(url).toContain('state=my_state_123');
        expect(url).toContain('client_id=test_client_id');
    });
});

describe('generateCSRFState', () => {
    it('returns a 32-character hex string', () => {
        const state = generateCSRFState();
        expect(state).toMatch(/^[0-9a-f]{32}$/);
    });

    it('returns a different value on each call', () => {
        expect(generateCSRFState()).not.toBe(generateCSRFState());
    });
});

describe('saveCSRFState', () => {
    it('calls redis.set with correct key, value and TTL', async () => {
        mockRedis.set.mockResolvedValue('OK');
        await saveCSRFState('abc123');
        expect(mockRedis.set).toHaveBeenCalledWith('oauth:state:abc123', '1', 'EX', 600);
    });
});

describe('consumeCSRFState', () => {
    it('returns true when redis.del returns 1', async () => {
        mockRedis.del.mockResolvedValue(1);
        expect(await consumeCSRFState('some_state')).toBe(true);
        expect(mockRedis.del).toHaveBeenCalledWith('oauth:state:some_state');
    });

    it('returns false when redis.del returns 0 (key did not exist)', async () => {
        mockRedis.del.mockResolvedValue(0);
        expect(await consumeCSRFState('missing_state')).toBe(false);
    });

    it('returns false immediately when state is undefined', async () => {
        expect(await consumeCSRFState(undefined)).toBe(false);
        expect(mockRedis.del).not.toHaveBeenCalled();
    });
});

describe('saveAuthToken', () => {
    it('returns a 64-character hex string', async () => {
        mockRedis.set.mockResolvedValue('OK');
        const token = await saveAuthToken('user-uuid');
        expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('calls redis.set with oauth:token: prefix, userId and 60s TTL', async () => {
        mockRedis.set.mockResolvedValue('OK');
        const token = await saveAuthToken('user-uuid');
        expect(mockRedis.set).toHaveBeenCalledWith(`oauth:token:${token}`, 'user-uuid', 'EX', 60);
    });
});

describe('consumeAuthToken', () => {
    it('returns the userId when token exists in Redis', async () => {
        mockRedis.get.mockResolvedValue('user-uuid');
        mockRedis.del.mockResolvedValue(1);

        const result = await consumeAuthToken('valid_token');
        expect(result).toBe('user-uuid');
        expect(mockRedis.del).toHaveBeenCalledWith('oauth:token:valid_token');
    });

    it('returns null when redis.get returns null', async () => {
        mockRedis.get.mockResolvedValue(null);
        const result = await consumeAuthToken('invalid_token');
        expect(result).toBeNull();
        expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('returns null immediately when token is undefined', async () => {
        const result = await consumeAuthToken(undefined);
        expect(result).toBeNull();
        expect(mockRedis.get).not.toHaveBeenCalled();
    });
});

describe('getValidAccessToken', () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const pastDate = new Date(Date.now() - 10 * 60 * 1000);   // 10 minutes ago

    const makeUser = (expiresAt: Date) => ({
        id: 'user-uuid',
        spotifyId: 'sp123',
        displayName: 'Test',
        email: null,
        avatarUrl: null,
        accessToken: encrypt('plain_access_token'),
        refreshToken: encrypt('plain_refresh_token'),
        tokenExpiresAt: expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    it('returns the decrypted access token when not expired', async () => {
        mockPrisma.user.findUniqueOrThrow.mockResolvedValue(makeUser(futureDate));

        const token = await getValidAccessToken('user-uuid');
        expect(token).toBe('plain_access_token');
    });

    it('refreshes and returns new access token when expired', async () => {
        mockPrisma.user.findUniqueOrThrow.mockResolvedValue(makeUser(pastDate));
        mockRefresh.mockResolvedValue({ access_token: 'new_access', expires_in: 3600 });
        mockPrisma.user.update.mockResolvedValue({} as any);

        const token = await getValidAccessToken('user-uuid');
        expect(token).toBe('new_access');
        expect(mockRefresh).toHaveBeenCalledWith('plain_refresh_token');
    });

    it('updates the refresh token when the API rotates it', async () => {
        mockPrisma.user.findUniqueOrThrow.mockResolvedValue(makeUser(pastDate));
        mockRefresh.mockResolvedValue({
            access_token: 'new_access',
            refresh_token: 'new_refresh',
            expires_in: 3600,
        });
        mockPrisma.user.update.mockResolvedValue({} as any);

        await getValidAccessToken('user-uuid');

        const updateCall = mockPrisma.user.update.mock.calls[0][0];
        expect(updateCall.data).toHaveProperty('refreshToken');
    });
});

describe('upsertUser', () => {
    it('encrypts access and refresh tokens before persisting', async () => {
        mockPrisma.user.upsert.mockResolvedValue({} as any);

        const profile = { id: 'sp123', display_name: 'Test User', images: [{ url: 'https://img.example.com/a.jpg' }] };
        const tokens = { access_token: 'plain_access', refresh_token: 'plain_refresh', expires_in: 3600 };

        await upsertUser(profile, tokens);

        const call = mockPrisma.user.upsert.mock.calls[0][0];
        expect(call.create.accessToken).not.toBe('plain_access');
        expect(call.create.refreshToken).not.toBe('plain_refresh');
        expect(call.create.accessToken).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
    });

    it('sets tokenExpiresAt approximately expires_in seconds from now', async () => {
        mockPrisma.user.upsert.mockResolvedValue({} as any);

        const before = Date.now();
        await upsertUser(
            { id: 'sp123', display_name: 'Test' },
            { access_token: 'a', refresh_token: 'r', expires_in: 3600 }
        );
        const after = Date.now();

        const call = mockPrisma.user.upsert.mock.calls[0][0];
        const expiresAt: Date = call.create.tokenExpiresAt;
        expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 3600 * 1000 - 100);
        expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 3600 * 1000 + 100);
    });
});
