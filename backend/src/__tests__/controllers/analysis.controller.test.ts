import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

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
}));

vi.mock('../../services/artist.services', () => ({
    getEnrichedTopArtists: vi.fn(),
}));

vi.mock('../../services/claude.services', () => ({
    analyzeMusicalProfile: vi.fn(),
}));

import { buildApp } from '../../app';
import { redis } from '../../config/redis';
import { getTopTracks } from '../../services/spotify.services';
import { getEnrichedTopArtists } from '../../services/artist.services';
import { analyzeMusicalProfile } from '../../services/claude.services';

const mockRedis = vi.mocked(redis);
const mockGetTopTracks = vi.mocked(getTopTracks);
const mockGetEnrichedTopArtists = vi.mocked(getEnrichedTopArtists);
const mockAnalyze = vi.mocked(analyzeMusicalProfile);

const app = buildApp();

const validAnalysis = {
    stats: { energy: 75, valence: 60, danceability: 80 },
    persona: 'Você ouve tudo o que ninguém conhece.',
    analysis: {
        main_genres: ['indie'],
        mood: 'introspectivo',
        listener_type: 'alternativo',
        summary: 'Gosto alternativo bem definido.',
    },
};

const fakeTrack = {
    id: 't1', name: 'Song', artists: [{ name: 'Artist' }],
    album: { name: 'Album', images: [{ url: 'http://img.example.com/a.jpg' }] },
};

const fakeArtist = {
    id: 'a1', name: 'Radiohead', image: 'http://img.example.com/r.jpg',
    genres: ['indie'], popularity: 80, similarArtists: [],
};

beforeAll(async () => {
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('GET /me/analysis', () => {
    it('returns cached analysis from Redis when available', async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify(validAnalysis));

        const response = await app.inject({ method: 'GET', url: '/me/analysis' });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.analysis.stats.energy).toBe(75);
        expect(mockAnalyze).not.toHaveBeenCalled();
    });

    it('fetches data, calls Claude and caches result on cache miss', async () => {
        mockRedis.get.mockResolvedValue(null);
        mockRedis.set.mockResolvedValue('OK');
        mockGetTopTracks.mockResolvedValue([fakeTrack]);
        mockGetEnrichedTopArtists.mockResolvedValue([fakeArtist]);
        mockAnalyze.mockResolvedValue(validAnalysis as any);

        const response = await app.inject({ method: 'GET', url: '/me/analysis' });

        expect(response.statusCode).toBe(200);
        expect(mockAnalyze).toHaveBeenCalledOnce();
        expect(mockRedis.set).toHaveBeenCalledWith(
            'analysis:user-uuid',
            JSON.stringify(validAnalysis),
            'EX',
            expect.any(Number)
        );
    });

    it('returns 502 when Spotify data fetch fails', async () => {
        mockRedis.get.mockResolvedValue(null);
        mockGetTopTracks.mockRejectedValue(new Error('Spotify down'));
        mockGetEnrichedTopArtists.mockResolvedValue([fakeArtist]);

        const response = await app.inject({ method: 'GET', url: '/me/analysis' });

        expect(response.statusCode).toBe(502);
    });

    it('returns 502 when Claude analysis fails', async () => {
        mockRedis.get.mockResolvedValue(null);
        mockGetTopTracks.mockResolvedValue([fakeTrack]);
        mockGetEnrichedTopArtists.mockResolvedValue([fakeArtist]);
        mockAnalyze.mockRejectedValue(new Error('Claude failed'));

        const response = await app.inject({ method: 'GET', url: '/me/analysis' });

        expect(response.statusCode).toBe(502);
    });
});
