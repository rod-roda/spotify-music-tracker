import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/auth.services', () => ({
    getValidAccessToken: vi.fn(),
}));

import { getValidAccessToken } from '../../services/auth.services';
import { requireSpotifyAuth } from '../../middlewares/auth.middleware';
import DefaultError from '../../errors/DefaultError';

const mockGetValidAccessToken = vi.mocked(getValidAccessToken);

const makeReply = () => ({});

const makeReq = (cookieValue?: string, valid = true) => ({
    cookies: { user_id: cookieValue ?? '' },
    unsignCookie: vi.fn().mockReturnValue({ valid, value: cookieValue ?? null }),
    userId: undefined as string | undefined,
    spotifyToken: undefined as string | undefined,
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('requireSpotifyAuth', () => {
    it('sets req.userId and req.spotifyToken on success', async () => {
        mockGetValidAccessToken.mockResolvedValue('valid_access_token');
        const req = makeReq('user-uuid', true);

        await requireSpotifyAuth(req as any, makeReply() as any);

        expect(req.userId).toBe('user-uuid');
        expect(req.spotifyToken).toBe('valid_access_token');
    });

    it('throws 401 when cookie is missing (empty string, invalid)', async () => {
        const req = makeReq('', false);

        await expect(requireSpotifyAuth(req as any, makeReply() as any)).rejects.toBeInstanceOf(DefaultError);
        await expect(requireSpotifyAuth(req as any, makeReply() as any)).rejects.toMatchObject({ status: 401 });
    });

    it('throws 401 when unsignCookie returns valid=false', async () => {
        const req = makeReq('tampered_cookie', false);

        await expect(requireSpotifyAuth(req as any, makeReply() as any)).rejects.toMatchObject({ status: 401 });
    });

    it('throws 401 when getValidAccessToken rejects', async () => {
        mockGetValidAccessToken.mockRejectedValue(new Error('Token expired'));
        const req = makeReq('user-uuid', true);

        await expect(requireSpotifyAuth(req as any, makeReply() as any)).rejects.toMatchObject({ status: 401 });
    });

    it('does not call getValidAccessToken when cookie is invalid', async () => {
        const req = makeReq('', false);

        await expect(requireSpotifyAuth(req as any, makeReply() as any)).rejects.toThrow();
        expect(mockGetValidAccessToken).not.toHaveBeenCalled();
    });
});
