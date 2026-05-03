import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { LastfmArtistSchema } from '../../schemas/lastfm.schema';

const validArtist = {
    name: 'Radiohead',
    stats: { listeners: '5000000', playcount: '200000000' },
    similar: {
        artist: [
            {
                name: 'Portishead',
                image: [{ '#text': 'https://img.example.com/p.jpg', size: 'large' }],
            },
        ],
    },
    tags: { tag: [{ name: 'alternative rock' }, { name: 'art rock' }] },
};

describe('LastfmArtistSchema', () => {
    it('parses a valid artist object', () => {
        expect(() => LastfmArtistSchema.parse(validArtist)).not.toThrow();
    });

    it('parses with empty similar.artist array', () => {
        expect(() => LastfmArtistSchema.parse({ ...validArtist, similar: { artist: [] } })).not.toThrow();
    });

    it('parses with empty tags.tag array', () => {
        expect(() => LastfmArtistSchema.parse({ ...validArtist, tags: { tag: [] } })).not.toThrow();
    });

    it('throws when stats.listeners is missing', () => {
        const bad = { ...validArtist, stats: { playcount: '200000000' } };
        expect(() => LastfmArtistSchema.parse(bad)).toThrow(ZodError);
    });

    it('throws when stats.playcount is missing', () => {
        const bad = { ...validArtist, stats: { listeners: '5000000' } };
        expect(() => LastfmArtistSchema.parse(bad)).toThrow(ZodError);
    });

    it('throws when name is missing', () => {
        const { name: _, ...noName } = validArtist;
        expect(() => LastfmArtistSchema.parse(noName)).toThrow(ZodError);
    });

    it('returns typed data with correct shape', () => {
        const result = LastfmArtistSchema.parse(validArtist);
        expect(result.name).toBe('Radiohead');
        expect(result.stats.listeners).toBe('5000000');
        expect(result.similar.artist[0].name).toBe('Portishead');
        expect(result.tags.tag[0].name).toBe('alternative rock');
    });
});
