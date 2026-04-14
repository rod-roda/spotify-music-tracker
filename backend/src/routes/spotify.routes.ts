import { FastifyInstance } from "fastify";
import { topTracksController, topArtistsController } from "../controllers/spotify.controller";
import { requireSpotifyAuth } from "../middlewares/auth.middleware";

export async function spotifyRoutes(app: FastifyInstance)
{
    app.get('/me/top-tracks', { preHandler: requireSpotifyAuth }, topTracksController);
    app.get('/me/top-artists', { preHandler: requireSpotifyAuth }, topArtistsController);
}