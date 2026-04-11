import { FastifyInstance } from "fastify";
import { loginController, callbackController } from "../controllers/auth.controller";

export async function authRoutes(app: FastifyInstance)
{
    app.get('/auth/login', loginController);
    app.get('/auth/callback', callbackController);
}