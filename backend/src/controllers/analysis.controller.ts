import { FastifyRequest, FastifyReply } from "fastify";
import { getTopTracks } from "../services/spotify.services";
import { getEnrichedTopArtists } from "../services/artist.services";
import { analyzeMusicalProfile } from "../services/claude.services";
import BadGateway from "../errors/BadGateway";

export async function analysisController(
    req: FastifyRequest,
    reply: FastifyReply
) {
    const [tracks, artists] = await Promise.all([
        getTopTracks(req.spotifyToken!, 20),
        getEnrichedTopArtists(req.spotifyToken!, 15),
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

    return reply.send({ analysis });
}
