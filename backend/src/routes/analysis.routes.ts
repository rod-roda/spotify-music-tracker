import { FastifyInstance } from "fastify";
import { analysisController } from "../controllers/analysis.controller";
import { requireSpotifyAuth } from "../middlewares/auth.middleware";

export async function analysisRoutes(app: FastifyInstance) {
    app.get("/me/analysis", { 
        preHandler: requireSpotifyAuth,
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } } 
    }, analysisController);
}
