import { FastifyInstance } from "fastify";
import { loginController, callbackController, logoutController } from "../controllers/auth.controller";
import { callbackQuerySchema } from "../schemas/route.schemas";

export async function authRoutes(app: FastifyInstance)
{
    app.get('/auth/login', loginController);
    app.get('/auth/callback', { schema: { querystring: callbackQuerySchema } }, callbackController);
    app.post('/auth/logout', logoutController);
}