import { FastifyRequest, FastifyReply } from "fastify";
import { getTopTracks, getSpotifyProfile } from "../services/spotify.services";
import { getEnrichedTopArtists } from "../services/artist.services";
import BadGateway from "../errors/BadGateway";
import type { TopItemsQuery } from "../schemas/route.schemas";
import Unauthorized from "../errors/Unauthorized";

export async function topTracksController(
    req: FastifyRequest,
    reply: FastifyReply
)
{
    if(!req.spotifyToken) {
        throw new Unauthorized();
    }
    
    // JSON Schema valida em runtime, fazemos type assertion aqui
    const { limit = 10, time_range = 'medium_term' } = req.query as TopItemsQuery;

    const tracks = await getTopTracks(req.spotifyToken, limit, time_range).catch((err) => {
        req.log.error(err);
        throw new BadGateway('Falha ao buscar dados do Spotify');
    });

    return reply.send({ tracks });
}

export async function topArtistsController(
    req: FastifyRequest,
    reply: FastifyReply
) 
{
    if(!req.spotifyToken) {
        throw new Unauthorized();
    }
    
    // JSON Schema valida em runtime, fazemos type assertion aqui
    const { limit = 10, time_range = 'medium_term' } = req.query as TopItemsQuery;

    const artists = await getEnrichedTopArtists(req.spotifyToken, limit, time_range).catch((err) => {
        req.log.error(err);
        throw new BadGateway('Falha ao buscar dados do Spotify');
    });

    return reply.send({ artists });
}

export async function profileController(
    req: FastifyRequest,
    reply: FastifyReply
)
{
    if(!req.spotifyToken) {
        throw new Unauthorized();
    }
    
    const profile = await getSpotifyProfile(req.spotifyToken).catch((err) => {
        req.log.error(err);
        throw new BadGateway('Falha ao buscar perfil do Spotify');
    });

    return reply.send({
        displayName: profile.display_name,
        avatarUrl: profile.images?.[0]?.url ?? null,
    });
}