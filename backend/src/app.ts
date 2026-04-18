import fastify from "fastify";
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { authRoutes } from "./routes/auth.routes";
import { spotifyRoutes } from "./routes/spotify.routes";
import { analysisRoutes } from "./routes/analysis.routes";
import { requireEnv } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";

declare module 'fastify' {
    interface FastifyRequest {
        spotifyToken?: string,
        userId?: string;
    }
}

export function buildApp()
{
    const app = fastify({logger: true});

    app.decorateRequest('spotifyToken', undefined);
    app.decorateRequest('userId', undefined);

    app.register(cors, {
        origin: [requireEnv('FRONTEND_URL'), requireEnv('FRONTEND_URL').replace('localhost', '127.0.0.1')],
        credentials: true
    });

    app.register(cookie, { secret: requireEnv('COOKIE_SECRET') });

    app.setErrorHandler(errorHandler);

    app.register(authRoutes);
    app.register(spotifyRoutes);
    app.register(analysisRoutes);

    app.get('/health', async () => {
        return {status: 'ok'}
    });

    return app;
}