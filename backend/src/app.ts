import fastify from "fastify";
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { authRoutes } from "./routes/auth.routes";
import { spotifyRoutes } from "./routes/spotify.routes";
import { analysisRoutes } from "./routes/analysis.routes";
import { requireEnv } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { prisma } from "./config/prisma";
import { redis } from "./config/redis";

declare module 'fastify' {
    interface FastifyRequest {
        spotifyToken?: string,
        userId?: string;
    }
}

export function buildApp()
{
    const IS_PROD = process.env.NODE_ENV?.toLowerCase() === 'production';

    const loggerConfig = IS_PROD
        ? { level: 'info' as const, redact: ['req.headers.cookie', 'req.headers.authorization'] }
        : { level: 'debug' as const, redact: ['req.headers.cookie', 'req.headers.authorization'], transport: { target: 'pino-pretty' } };

    const app = fastify({
        logger: loggerConfig,
        trustProxy: true,
        requestTimeout: 60000
    });

    app.decorateRequest('spotifyToken', undefined);
    app.decorateRequest('userId', undefined);

    app.register(cors, {
        origin: [
            requireEnv('FRONTEND_URL'), 
            requireEnv('FRONTEND_URL').replace('localhost', '127.0.0.1')
        ],
        methods: ['GET'],
        allowedHeaders: [
            'Content-Type',
            'Authorization'
        ],
        credentials: true,
        maxAge: 86400 //24hrs
    });

    app.register(rateLimit, {
        max: 50,
        timeWindow: '1 minute',
        errorResponseBuilder: () => {
            return {
                status: 429,
                message: "Too Many Requests"
            };
        }
    });

    app.register(helmet);
    app.register(cookie, { secret: requireEnv('COOKIE_SECRET') });

    app.setErrorHandler(errorHandler);

    app.register(authRoutes);
    app.register(spotifyRoutes);
    app.register(analysisRoutes);

    app.get('/health', async (request, reply) => {
        const checks = {
            'database': 'unknown',
            'redis': 'unknown'
        }

        try {
            await prisma.$queryRaw`SELECT 1`;
            checks.database = 'ok';
        } catch(err) {
            checks.database = 'error';
        }
        
        try {
            await redis.ping();
            checks.redis = 'ok';
        } catch(err) {
            checks.redis = 'error';
        }
        
        const isHealthy = Object.values(checks).every(v => v === 'ok');
        const status = isHealthy ? 200 : 503;

        return reply.status(status).send({
            status,
            checks
        });
    });

    return app;
}