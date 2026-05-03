import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
    SpotifyTokenSchema,
    SpotifyProfileSchema,
    RefreshTokenSchema,
    TopTracksSchema,
    TopArtistsSchema,
} from '../../schemas/spotify.schema';

describe('SpotifyTokenSchema', () => {
    const valid = { access_token: 'token', refresh_token: 'refresh', expires_in: 3600 };

    it('parses a valid token object', () => {
        expect(() => SpotifyTokenSchema.parse(valid)).not.toThrow();
    });

    it('throws when access_token is missing', () => {
        expect(() => SpotifyTokenSchema.parse({ ...valid, access_token: undefined })).toThrow(ZodError);
    });

    it('throws when expires_in is a string instead of number', () => {
        expect(() => SpotifyTokenSchema.parse({ ...valid, expires_in: '3600' })).toThrow(ZodError);
    });
});

describe('SpotifyProfileSchema', () => {
    const valid = { id: 'user123', display_name: 'Test User' };

    it('parses a minimal valid profile', () => {
        expect(() => SpotifyProfileSchema.parse(valid)).not.toThrow();
    });

    it('parses with optional email and images', () => {
        expect(() => SpotifyProfileSchema.parse({
            ...valid,
            email: 'test@example.com',
            images: [{ url: 'https://img.example.com/avatar.jpg' }],
        })).not.toThrow();
    });

    it('email is optional', () => {
        const result = SpotifyProfileSchema.parse(valid);
        expect(result.email).toBeUndefined();
    });

    it('images is optional', () => {
        const result = SpotifyProfileSchema.parse(valid);
        expect(result.images).toBeUndefined();
    });

    it('throws when id is missing', () => {
        expect(() => SpotifyProfileSchema.parse({ display_name: 'Test' })).toThrow(ZodError);
    });
});

describe('RefreshTokenSchema', () => {
    it('parses with optional refresh_token', () => {
        const result = RefreshTokenSchema.parse({ access_token: 'new', expires_in: 3600 });
        expect(result.refresh_token).toBeUndefined();
    });

    it('parses with refresh_token present', () => {
        const result = RefreshTokenSchema.parse({ access_token: 'new', refresh_token: 'new_refresh', expires_in: 3600 });
        expect(result.refresh_token).toBe('new_refresh');
    });
});

describe('TopTracksSchema', () => {
    const validTrack = {
        id: 'track1',
        name: 'Song Name',
        artists: [{ name: 'Artist' }],
        album: { name: 'Album', images: [{ url: 'https://img.example.com/album.jpg' }] },
    };

    it('parses a valid array of tracks', () => {
        expect(() => TopTracksSchema.parse([validTrack])).not.toThrow();
    });

    it('parses an empty array', () => {
        expect(TopTracksSchema.parse([])).toEqual([]);
    });

    it('throws when a required track field is missing', () => {
        expect(() => TopTracksSchema.parse([{ ...validTrack, id: undefined }])).toThrow(ZodError);
    });
});

describe('TopArtistsSchema', () => {
    const validArtist = {
        id: 'artist1',
        name: 'Artist Name',
        images: [{ url: 'https://img.example.com/artist.jpg' }],
    };

    it('parses a valid array of artists', () => {
        expect(() => TopArtistsSchema.parse([validArtist])).not.toThrow();
    });

    it('parses an empty array', () => {
        expect(TopArtistsSchema.parse([])).toEqual([]);
    });

    it('throws when name is missing', () => {
        expect(() => TopArtistsSchema.parse([{ id: 'a1', images: [] }])).toThrow(ZodError);
    });
});
