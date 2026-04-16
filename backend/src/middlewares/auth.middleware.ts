import { FastifyRequest, FastifyReply } from "fastify";
import { getValidAccessToken } from "../services/auth.services";
import DefaultError from "../errors/DefaultError";

export async function requireSpotifyAuth(
    req: FastifyRequest,
    reply: FastifyReply
) {
    const cookie = req.unsignCookie(req.cookies.user_id ?? '');

    if (!cookie.valid || !cookie.value) {
        throw new DefaultError('Missing session. Please login first.', 401);
    }

    const accessToken = await getValidAccessToken(cookie.value).catch(() => {
        throw new DefaultError('Session expired. Please login again.', 401);
    });

    req.spotifyToken = accessToken;
}
