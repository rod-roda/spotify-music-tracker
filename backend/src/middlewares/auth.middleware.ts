import { FastifyRequest, FastifyReply } from "fastify";
import { getValidAccessToken } from "../services/auth.services";
import DefaultError from "../errors/DefaultError";

export async function requireSpotifyAuth(
    req: FastifyRequest,
    reply: FastifyReply
) {
    const cookie = req.unsignCookie(req.cookies.user_id ?? '');

    if (!cookie.valid || !cookie.value) {
        throw new DefaultError('Sessão não encontrada. Por favor, faça login primeiro.', 401);
    }

    const accessToken = await getValidAccessToken(cookie.value).catch(() => {
        throw new DefaultError('Sessão expirada. Por favor, faça login novamente.', 401);
    });

    req.userId = cookie.value;
    req.spotifyToken = accessToken;
}
