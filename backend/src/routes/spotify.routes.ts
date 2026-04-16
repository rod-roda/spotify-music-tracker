import { FastifyInstance } from "fastify";
import { topTracksController, topArtistsController } from "../controllers/spotify.controller";
import { requireSpotifyAuth } from "../middlewares/auth.middleware";
import { topItemsQuerySchema } from "../schemas/route.schemas";

export async function spotifyRoutes(app: FastifyInstance)
{
    app.get('/me/top-tracks', { schema: { querystring: topItemsQuerySchema }, preHandler: requireSpotifyAuth }, topTracksController);
    app.get('/me/top-artists', { schema: { querystring: topItemsQuerySchema }, preHandler: requireSpotifyAuth }, topArtistsController);
}