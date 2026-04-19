import { FastifyInstance } from "fastify";
import { loginController, callbackController, sessionController, logoutController } from "../controllers/auth.controller";
import { callbackQuerySchema } from "../schemas/route.schemas";

export async function authRoutes(app: FastifyInstance)
{
    app.get('/auth/login', loginController);
    app.get('/auth/callback', { schema: { querystring: callbackQuerySchema } }, callbackController);
    app.get('/auth/session', sessionController);
    app.get('/auth/logout', logoutController);
}