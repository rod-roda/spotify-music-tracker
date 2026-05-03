import { getTopArtists } from "./spotify.services";
import { getArtistData } from "./lastfm.services";
import { calculatePopularity } from "../utils/popularity";
import BadGateway from "../errors/BadGateway";

interface SimilarArtist {
    name: string;
    image: string;
}

interface EnrichedArtist {
    id: string;
    name: string;
    image: string;
    genres: string[];
    popularity: number;
    similarArtists: SimilarArtist[];
}

export async function getEnrichedTopArtists(accessToken: string, limit: number = 10, timeRange: string = 'medium_term'): Promise<EnrichedArtist[]>
{
    const spotifyArtists = await getTopArtists(accessToken, limit, timeRange);

    const enriched = await Promise.allSettled(
        spotifyArtists.map(async (artist) => {
            const lastfm = await getArtistData(artist.name);

            return {
                id: artist.id,
                name: artist.name,
                image: artist.images[0]?.url ?? '',
                genres: lastfm.tags.tag.map(t => t.name),
                popularity: calculatePopularity(
                    Number(lastfm.stats.listeners),
                    Number(lastfm.stats.playcount)
                ),
                similarArtists: lastfm.similar.artist.map(a => ({
                    name: a.name,
                    image: a.image.find(i => i.size === 'large')?.["#text"] ?? a.image[0]?.["#text"] ?? ''
                }))
            };
        })
    );

    const results = enriched
        .filter((r): r is PromiseFulfilledResult<EnrichedArtist> => r.status === 'fulfilled')
        .map(r => r.value);

    if (results.length === 0 && spotifyArtists.length > 0) {
        throw new BadGateway('Falha ao enriquecer dados do artista via Last.fm');
    }

    return results;
}
