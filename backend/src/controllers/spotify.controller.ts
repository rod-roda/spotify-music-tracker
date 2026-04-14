import { FastifyRequest, FastifyReply } from "fastify";
import { getTopTracks, getTopArtists } from "../services/spotify.services";

export async function topTracksController(
    req: FastifyRequest,
    reply: FastifyReply
)
{
    try {
        const tracks = await getTopTracks(req.spotifyToken!);
        return reply.send({ tracks });
    } catch (err) {
        req.log.error(err, 'Failed to fetch top tracks');
        return reply.status(502).send({ error: 'Failed to fetch data from Spotify' });
    }
}

export async function topArtistsController(
    req: FastifyRequest,
    reply: FastifyReply
) 
{
    try {
        const artists = await getTopArtists(req.spotifyToken!);
        return reply.send({ artists });
    } catch (err) {
        req.log.error(err, 'Failed to fetch top artists');
        return reply.status(502).send({ error: 'Failed to fetch data from Spotify' });
    }
}