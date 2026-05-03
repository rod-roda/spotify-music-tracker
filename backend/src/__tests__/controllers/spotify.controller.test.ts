import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../config/redis', () => ({
    redis: { get: vi.fn(), set: vi.fn(), del: vi.fn(), ping: vi.fn().mockResolvedValue('PONG') },
}));

vi.mock('../../config/prisma', () => ({
    prisma: { user: { findUniqueOrThrow: vi.fn(), update: vi.fn(), upsert: vi.fn() }, $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]) },
}));

vi.mock('../../middlewares/auth.middleware', () => ({
    requireSpotifyAuth: vi.fn(async (req: any) => {
        req.userId = 'user-uuid';
        req.spotifyToken = 'fake_spotify_token';
    }),
}));

vi.mock('../../services/spotify.services', () => ({
    getTopTracks: vi.fn(),
    getSpotifyProfile: vi.fn(),
    getTopArtists: vi.fn(),
}));

vi.mock('../../services/artist.services', () => ({
    getEnrichedTopArtists: vi.fn(),
}));

import { buildApp } from '../../app';
import { getTopTracks, getSpotifyProfile } from '../../services/spotify.services';
import { getEnrichedTopArtists } from '../../services/artist.services';

const mockGetTopTracks = vi.mocked(getTopTracks);
const mockGetSpotifyProfile = vi.mocked(getSpotifyProfile);
const mockGetEnrichedTopArtists = vi.mocked(getEnrichedTopArtists);

const app = buildApp();

beforeAll(async () => {
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

describe('GET /me/top-tracks', () => {
    it('returns 200 with tracks array', async () => {
        const track = {
            id: 't1', name: 'Song', artists: [{ name: 'Artist' }],
            album: { name: 'Album', images: [{ url: 'http://img.example.com/a.jpg' }] },
        };
        mockGetTopTracks.mockResolvedValue([track]);

        const response = await app.inject({ method: 'GET', url: '/me/top-tracks' });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.tracks).toHaveLength(1);
        expect(body.tracks[0].name).toBe('Song');
    });

    it('returns 502 when Spotify service fails', async () => {
        mockGetTopTracks.mockRejectedValue(new Error('Spotify down'));

        const response = await app.inject({ method: 'GET', url: '/me/top-tracks' });

        expect(response.statusCode).toBe(502);
    });
});

describe('GET /me/top-artists', () => {
    it('returns 200 with enriched artists', async () => {
        mockGetEnrichedTopArtists.mockResolvedValue([
            { id: 'a1', name: 'Radiohead', image: 'http://img.example.com/r.jpg', genres: ['indie'], popularity: 80, similarArtists: [] },
        ]);

        const response = await app.inject({ method: 'GET', url: '/me/top-artists' });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.artists[0].name).toBe('Radiohead');
    });

    it('returns 502 when enrichment service fails', async () => {
        mockGetEnrichedTopArtists.mockRejectedValue(new Error('Last.fm down'));

        const response = await app.inject({ method: 'GET', url: '/me/top-artists' });

        expect(response.statusCode).toBe(502);
    });
});

describe('GET /me/profile', () => {
    it('returns 200 with displayName and avatarUrl', async () => {
        mockGetSpotifyProfile.mockResolvedValue({
            id: 'sp123',
            display_name: 'Test User',
            images: [{ url: 'http://img.example.com/avatar.jpg' }],
        });

        const response = await app.inject({ method: 'GET', url: '/me/profile' });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.displayName).toBe('Test User');
        expect(body.avatarUrl).toBe('http://img.example.com/avatar.jpg');
    });

    it('returns null avatarUrl when profile has no images', async () => {
        mockGetSpotifyProfile.mockResolvedValue({ id: 'sp123', display_name: 'Test User' });

        const response = await app.inject({ method: 'GET', url: '/me/profile' });

        const body = JSON.parse(response.body);
        expect(body.avatarUrl).toBeNull();
    });

    it('returns 502 when Spotify service fails', async () => {
        mockGetSpotifyProfile.mockRejectedValue(new Error('Spotify down'));

        const response = await app.inject({ method: 'GET', url: '/me/profile' });

        expect(response.statusCode).toBe(502);
    });
});
