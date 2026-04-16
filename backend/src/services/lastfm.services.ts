import axios from "axios";
import { requireEnv } from "../config/env";
import { LastfmArtistSchema } from "../schemas/lastfm.schema";
import type { LastfmArtist } from "../schemas/lastfm.schema";

export async function getArtistData(artist: string): Promise<LastfmArtist>
{
    const response = await axios.get('https://ws.audioscrobbler.com/2.0', {
        params: {
            method: 'artist.getinfo',
            artist,
            api_key: requireEnv('LASTFM_API_KEY'),
            format: 'json'
        }
    });

    return LastfmArtistSchema.parse(response.data.artist);
}