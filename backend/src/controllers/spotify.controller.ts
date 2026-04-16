import { FastifyRequest, FastifyReply } from "fastify";
import { getTopTracks } from "../services/spotify.services";
import { getEnrichedTopArtists } from "../services/artist.services";
import BadGateway from "../errors/BadGateway";
import type { TopItemsQuery } from "../schemas/route.schemas";

export async function topTracksController(
    req: FastifyRequest,
    reply: FastifyReply
)
{
    // JSON Schema valida em runtime, fazemos type assertion aqui
    const { limit = 10, time_range = 'medium_term' } = req.query as TopItemsQuery;

    const tracks = await getTopTracks(req.spotifyToken!, limit, time_range).catch((err) => {
        req.log.error(err);
        throw new BadGateway('Failed to fetch data from Spotify');
    });

    return reply.send({ tracks });
}

export async function topArtistsController(
    req: FastifyRequest,
    reply: FastifyReply
) 
{
    // JSON Schema valida em runtime, fazemos type assertion aqui
    const { limit = 10, time_range = 'medium_term' } = req.query as TopItemsQuery;

    const artists = await getEnrichedTopArtists(req.spotifyToken!, limit, time_range).catch((err) => {
        req.log.error(err);
        throw new BadGateway('Failed to fetch data from Spotify');
    });

    return reply.send({ artists });
}