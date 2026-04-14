import fastify from "fastify";
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { authRoutes } from "./routes/auth.route";
import { spotifyRoutes } from "./routes/spotify.routes";
import { requireEnv } from "./lib/env";

declare module 'fastify' {
    interface FastifyRequest {
        spotifyToken?: string;
    }
}

export function buildApp()
{
    const app = fastify({logger: true});

    app.decorateRequest('spotifyToken', undefined);

    app.register(cors, {
        origin: [requireEnv('FRONTEND_URL'), requireEnv('FRONTEND_URL').replace('localhost', '127.0.0.1')],
        credentials: true
    });

    app.register(cookie, { secret: requireEnv('COOKIE_SECRET') });
    app.register(authRoutes);
    app.register(spotifyRoutes);

    app.get('/health', async () => {
        return {status: 'ok'}
    });

    return app;
}