import { FastifyRequest, FastifyReply } from "fastify";
import { getValidAccessToken } from "../services/auth.services";

export async function requireSpotifyAuth(
    req: FastifyRequest,
    reply: FastifyReply
) {
    const cookie = req.unsignCookie(req.cookies.user_id ?? '');

    if (!cookie.valid || !cookie.value) {
        return reply.status(401).send({ 
            error: 'Unauthorized',
            message: 'Missing session. Please login first.' 
        });
    }

    try {
        const accessToken = await getValidAccessToken(cookie.value);
        req.spotifyToken = accessToken;
    } catch (err) {
        req.log.error(err, 'Failed to get valid access token');
        return reply.status(401).send({ 
            error: 'Unauthorized',
            message: 'Session expired. Please login again.'
        });
    }
}
