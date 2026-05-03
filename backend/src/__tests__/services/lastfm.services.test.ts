import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');

import axios from 'axios';
import { getArtistData } from '../../services/lastfm.services';

const mockAxios = vi.mocked(axios);

const validArtist = {
    name: 'Radiohead',
    stats: { listeners: '5000000', playcount: '200000000' },
    similar: { artist: [{ name: 'Portishead', image: [{ '#text': 'http://img.example.com/p.jpg', size: 'large' }] }] },
    tags: { tag: [{ name: 'alternative rock' }] },
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getArtistData', () => {
    it('calls the Last.fm API with correct params', async () => {
        mockAxios.get.mockResolvedValue({ data: { artist: validArtist } });

        await getArtistData('Radiohead');

        expect(mockAxios.get).toHaveBeenCalledWith(
            'https://ws.audioscrobbler.com/2.0',
            expect.objectContaining({
                params: expect.objectContaining({
                    method: 'artist.getinfo',
                    artist: 'Radiohead',
                    api_key: 'test_lastfm_key',
                    format: 'json',
                }),
            })
        );
    });

    it('returns parsed artist data', async () => {
        mockAxios.get.mockResolvedValue({ data: { artist: validArtist } });

        const result = await getArtistData('Radiohead');
        expect(result.name).toBe('Radiohead');
        expect(result.stats.listeners).toBe('5000000');
    });

    it('propagates network errors', async () => {
        mockAxios.get.mockRejectedValue(new Error('Network Error'));

        await expect(getArtistData('Radiohead')).rejects.toThrow('Network Error');
    });

    it('throws ZodError when API returns malformed data', async () => {
        mockAxios.get.mockResolvedValue({ data: { artist: { name: 'Only name' } } });

        await expect(getArtistData('Radiohead')).rejects.toThrow();
    });
});
