import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/spotify.services', () => ({
    getTopArtists: vi.fn(),
}));

vi.mock('../../services/lastfm.services', () => ({
    getArtistData: vi.fn(),
}));

vi.mock('../../utils/popularity', () => ({
    calculatePopularity: vi.fn().mockReturnValue(75),
}));

import { getTopArtists } from '../../services/spotify.services';
import { getArtistData } from '../../services/lastfm.services';
import { getEnrichedTopArtists } from '../../services/artist.services';
import BadGateway from '../../errors/BadGateway';

const mockGetTopArtists = vi.mocked(getTopArtists);
const mockGetArtistData = vi.mocked(getArtistData);

const spotifyArtist = {
    id: 'artist1',
    name: 'Radiohead',
    images: [
        { url: 'http://img.example.com/small.jpg' },
        { url: 'http://img.example.com/large.jpg' },
    ],
};

const lastfmArtist = {
    name: 'Radiohead',
    stats: { listeners: '5000000', playcount: '200000000' },
    similar: {
        artist: [{
            name: 'Portishead',
            image: [
                { '#text': 'http://img.example.com/small.jpg', size: 'small' },
                { '#text': 'http://img.example.com/large.jpg', size: 'large' },
            ],
        }],
    },
    tags: { tag: [{ name: 'alternative rock' }, { name: 'art rock' }] },
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getEnrichedTopArtists', () => {
    it('returns enriched artists when all lookups succeed', async () => {
        mockGetTopArtists.mockResolvedValue([spotifyArtist]);
        mockGetArtistData.mockResolvedValue(lastfmArtist);

        const result = await getEnrichedTopArtists('token', 1);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('artist1');
        expect(result[0].name).toBe('Radiohead');
        expect(result[0].genres).toEqual(['alternative rock', 'art rock']);
        expect(result[0].popularity).toBe(75);
    });

    it('returns only successful results when some Last.fm lookups fail', async () => {
        const artist2 = { ...spotifyArtist, id: 'artist2', name: 'Portishead' };
        mockGetTopArtists.mockResolvedValue([spotifyArtist, artist2]);
        mockGetArtistData
            .mockResolvedValueOnce(lastfmArtist)
            .mockRejectedValueOnce(new Error('Not found'));

        const result = await getEnrichedTopArtists('token', 2);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Radiohead');
    });

    it('throws BadGateway when all Last.fm lookups fail and artists list is non-empty', async () => {
        mockGetTopArtists.mockResolvedValue([spotifyArtist]);
        mockGetArtistData.mockRejectedValue(new Error('Last.fm down'));

        await expect(getEnrichedTopArtists('token', 1)).rejects.toBeInstanceOf(BadGateway);
    });

    it('returns empty array without throwing when Spotify returns no artists', async () => {
        mockGetTopArtists.mockResolvedValue([]);

        const result = await getEnrichedTopArtists('token', 5);

        expect(result).toEqual([]);
        expect(mockGetArtistData).not.toHaveBeenCalled();
    });

    it('uses large image for similar artist when available', async () => {
        mockGetTopArtists.mockResolvedValue([spotifyArtist]);
        mockGetArtistData.mockResolvedValue(lastfmArtist);

        const result = await getEnrichedTopArtists('token', 1);

        expect(result[0].similarArtists[0].image).toBe('http://img.example.com/large.jpg');
    });

    it('falls back to first image when no large image exists for similar artist', async () => {
        const noLargeImage = {
            ...lastfmArtist,
            similar: {
                artist: [{
                    name: 'Portishead',
                    image: [{ '#text': 'http://img.example.com/small.jpg', size: 'small' }],
                }],
            },
        };
        mockGetTopArtists.mockResolvedValue([spotifyArtist]);
        mockGetArtistData.mockResolvedValue(noLargeImage);

        const result = await getEnrichedTopArtists('token', 1);

        expect(result[0].similarArtists[0].image).toBe('http://img.example.com/small.jpg');
    });

    it('returns empty string for similar artist image when image array is empty', async () => {
        const noImage = {
            ...lastfmArtist,
            similar: {
                artist: [{ name: 'Portishead', image: [] }],
            },
        };
        mockGetTopArtists.mockResolvedValue([spotifyArtist]);
        mockGetArtistData.mockResolvedValue(noImage);

        const result = await getEnrichedTopArtists('token', 1);

        expect(result[0].similarArtists[0].image).toBe('');
    });
});
