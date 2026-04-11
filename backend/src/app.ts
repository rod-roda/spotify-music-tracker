import fastify from "fastify";
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { authRoutes } from "./routes/auth.route";

export function buildApp()
{
    const app = fastify({logger: true});

    app.register(cors, {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true
    });

    app.register(cookie);
    app.register(authRoutes);

    app.get('/health', async () => {
        return {status: 'ok'}
    });

    return app;
}