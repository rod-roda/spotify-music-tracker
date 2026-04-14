import axios from "axios";
import { z } from "zod";

const TopTracksSchema = z.array(z.object({
    id: z.string(),
    name: z.string(),
    artists: z.array(z.object({ name: z.string() })),
    album: z.object({ name: z.string(), images: z.array(z.object({ url: z.string() })) }),
    popularity: z.number().optional()
}));
const TopArtistsSchema = z.array(z.object({
    id: z.string(),
    name: z.string(),
    genres: z.array(z.string()).optional(),
    images: z.array(z.object({ url: z.string() }))
}));

export type TopTracks = z.infer<typeof TopTracksSchema>;
export type TopArtists = z.infer<typeof TopArtistsSchema>;

export async function getTopTracks(accessToken: string, limit: number = 10)
{
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, time_range: 'medium_term' }
    });

    return TopTracksSchema.parse(response.data.items);
}

export async function getTopArtists(accessToken: string, limit: number = 10)
{
    console.log(accessToken);
    const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, time_range: 'medium_term' }
    });

    return TopArtistsSchema.parse(response.data.items);
}