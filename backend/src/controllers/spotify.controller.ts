import { FastifyRequest, FastifyReply } from "fastify";
import { getTopTracks } from "../services/spotify.services";
import { getEnrichedTopArtists } from "../services/artist.services";
import BadGateway from "../errors/BadGateway";

export async function topTracksController(
    req: FastifyRequest,
    reply: FastifyReply
)
{
    const tracks = await getTopTracks(req.spotifyToken!).catch((err) => {
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
    const artists = await getEnrichedTopArtists(req.spotifyToken!).catch((err) => {
        req.log.error(err);
        throw new BadGateway('Failed to fetch data from Spotify');
    });

    return reply.send({ artists });
}