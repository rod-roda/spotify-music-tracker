import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('axios');

import axios from 'axios';
import {
    exchangeCode,
    getSpotifyProfile,
    requestTokenRefresh,
    getTopTracks,
    getTopArtists,
} from '../../services/spotify.services';

const mockAxios = vi.mocked(axios);

const expectedAuthHeader = `Basic ${Buffer.from('test_client_id:test_client_secret').toString('base64')}`;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('exchangeCode', () => {
    it('calls axios.post with correct URL and Authorization header', async () => {
        mockAxios.post.mockResolvedValue({
            data: { access_token: 'acc', refresh_token: 'ref', expires_in: 3600 },
        });

        await exchangeCode('auth_code');

        expect(mockAxios.post).toHaveBeenCalledWith(
            'https://accounts.spotify.com/api/token',
            expect.any(URLSearchParams),
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: expectedAuthHeader }),
            })
        );
    });

    it('returns the parsed token object', async () => {
        mockAxios.post.mockResolvedValue({
            data: { access_token: 'acc', refresh_token: 'ref', expires_in: 3600 },
        });

        const result = await exchangeCode('auth_code');
        expect(result).toEqual({ access_token: 'acc', refresh_token: 'ref', expires_in: 3600 });
    });

    it('throws ZodError when API returns unexpected shape', async () => {
        mockAxios.post.mockResolvedValue({ data: { unexpected: true } });

        await expect(exchangeCode('code')).rejects.toThrow();
    });
});

describe('getSpotifyProfile', () => {
    it('calls axios.get with correct URL and Bearer header', async () => {
        mockAxios.get.mockResolvedValue({
            data: { id: 'user1', display_name: 'Test' },
        });

        await getSpotifyProfile('my_access_token');

        expect(mockAxios.get).toHaveBeenCalledWith(
            'https://api.spotify.com/v1/me',
            expect.objectContaining({
                headers: { Authorization: 'Bearer my_access_token' },
            })
        );
    });
});

describe('requestTokenRefresh', () => {
    it('sends grant_type=refresh_token in request body', async () => {
        mockAxios.post.mockResolvedValue({
            data: { access_token: 'new_acc', expires_in: 3600 },
        });

        await requestTokenRefresh('my_refresh_token');

        const body = mockAxios.post.mock.calls[0][1] as URLSearchParams;
        expect(body.get('grant_type')).toBe('refresh_token');
        expect(body.get('refresh_token')).toBe('my_refresh_token');
    });
});

describe('getTopTracks', () => {
    it('calls correct URL with limit and time_range params', async () => {
        mockAxios.get.mockResolvedValue({ data: { items: [] } });

        await getTopTracks('token', 20, 'short_term');

        expect(mockAxios.get).toHaveBeenCalledWith(
            'https://api.spotify.com/v1/me/top/tracks',
            expect.objectContaining({
                params: { limit: 20, time_range: 'short_term' },
            })
        );
    });

    it('parses response.data.items array', async () => {
        const item = {
            id: 't1', name: 'Song', artists: [{ name: 'Artist' }],
            album: { name: 'Album', images: [{ url: 'http://img.example.com/a.jpg' }] },
        };
        mockAxios.get.mockResolvedValue({ data: { items: [item] } });

        const result = await getTopTracks('token');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Song');
    });
});

describe('getTopArtists', () => {
    it('calls correct URL with limit and time_range params', async () => {
        mockAxios.get.mockResolvedValue({ data: { items: [] } });

        await getTopArtists('token', 10, 'long_term');

        expect(mockAxios.get).toHaveBeenCalledWith(
            'https://api.spotify.com/v1/me/top/artists',
            expect.objectContaining({
                params: { limit: 10, time_range: 'long_term' },
            })
        );
    });
});

describe('spotifyApiRequest retry logic', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('retries once after a 429 and returns success', async () => {
        const rateLimitError = {
            response: { status: 429, headers: { 'retry-after': '1' } },
        };
        mockAxios.isAxiosError.mockReturnValue(true);
        mockAxios.get
            .mockRejectedValueOnce(rateLimitError)
            .mockResolvedValueOnce({ data: { items: [] } });

        const promise = getTopTracks('token');
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(mockAxios.get).toHaveBeenCalledTimes(2);
        expect(result).toEqual([]);
    });

    it('throws after exhausting all retries with 429', async () => {
        const rateLimitError = {
            response: { status: 429, headers: { 'retry-after': '1' } },
        };
        mockAxios.isAxiosError.mockReturnValue(true);
        mockAxios.get.mockRejectedValue(rateLimitError);

        const promise = getTopTracks('token');
        promise.catch(() => {}); // prevent unhandled rejection during timer advancement
        await vi.runAllTimersAsync();

        await expect(promise).rejects.toBeDefined();
        expect(mockAxios.get.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('does not retry on non-429 errors', async () => {
        const networkError = { response: { status: 500 } };
        mockAxios.isAxiosError.mockReturnValue(false);
        mockAxios.get.mockRejectedValue(networkError);

        await expect(getTopTracks('token')).rejects.toBeDefined();
        expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });
});
