import { z } from "zod";

export const SpotifyTokenSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number(),
});

export const SpotifyProfileSchema = z.object({
    id: z.string(),
    display_name: z.string(),
    email: z.string().optional(),
    images: z.array(z.object({ url: z.string() })).optional(),
});

export const RefreshTokenSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
    expires_in: z.number(),
});

export const TopTracksSchema = z.array(z.object({
    id: z.string(),
    name: z.string(),
    artists: z.array(z.object({ name: z.string() })),
    album: z.object({ name: z.string(), images: z.array(z.object({ url: z.string() })) }),
}));

export const TopArtistsSchema = z.array(z.object({
    id: z.string(),
    name: z.string(),
    images: z.array(z.object({ url: z.string() }))
}));

export type SpotifyTokenResponse = z.infer<typeof SpotifyTokenSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenSchema>;
export type SpotifyProfile = z.infer<typeof SpotifyProfileSchema>;
export type TopTracks = z.infer<typeof TopTracksSchema>;
export type TopArtists = z.infer<typeof TopArtistsSchema>;
