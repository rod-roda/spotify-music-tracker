import { FastifyRequest, FastifyReply } from "fastify";
import { getTopTracks } from "../services/spotify.services";
import { getEnrichedTopArtists } from "../services/artist.services";
import { analyzeMusicalProfile } from "../services/claude.services";
import { redis } from "../config/redis";
import BadGateway from "../errors/BadGateway";
import Unauthorized from "../errors/Unauthorized";

const ANALYSIS_TTL = 60 * 60 * 24;

export async function analysisController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    if(!req.spotifyToken || !req.userId) {
        throw new Unauthorized();
    }

    const cacheKey = `analysis:${req.userId}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
        return reply.send({ analysis: JSON.parse(cached) });
    }
    
    const [tracks, artists] = await Promise.all([
        getTopTracks(req.spotifyToken, 20),
        getEnrichedTopArtists(req.spotifyToken, 15),
    ]).catch((err) => {
        req.log.error(err);
        throw new BadGateway("Failed to fetch data from Spotify");
    });

    const userData = {
        artists: artists.map((a) => ({
            name: a.name,
            genres: a.genres,
            popularity: a.popularity,
        })),
        tracks: tracks.map((t) => ({
            name: t.name,
            artists: t.artists.map((a) => a.name),
        })),
    };

    const analysis = await analyzeMusicalProfile(userData).catch((err) => {
        req.log.error(err);
        throw new BadGateway("Failed to generate musical analysis");
    });

    await redis.set(cacheKey, JSON.stringify(analysis), "EX", ANALYSIS_TTL);
    return reply.send({ analysis });    
}
