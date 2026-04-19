import { FastifyRequest, FastifyReply } from "fastify";
import { getAuthUrl, generateCSRFState, saveCSRFState, consumeCSRFState, upsertUser } from "../services/auth.services";
import { exchangeCode, getSpotifyProfile } from "../services/spotify.services";
import { requireEnv } from "../config/env";
import { COOKIE_OPTIONS } from "../config/cookie";
import DefaultError from "../errors/DefaultError";
import BadRequest from "../errors/BadRequest";
import type { CallbackQuery } from "../schemas/route.schemas";

const FRONTEND_URL = requireEnv('FRONTEND_URL');

export async function loginController(req: FastifyRequest, reply: FastifyReply)
{
    const state = generateCSRFState();
    await saveCSRFState(state);

    const url = getAuthUrl(state);
    reply.redirect(url);
}

export async function callbackController(
    req: FastifyRequest,
    reply: FastifyReply
) 
{
    const { code, error, state } = req.query as CallbackQuery;

    if(error || !code) {
        throw new BadRequest('Auth denied or missing code');
    }

    const isValid = await consumeCSRFState(state);
    if (!isValid) {
        throw new DefaultError('Invalid state (CSRF protection)', 403);
    }

    const tokens = await exchangeCode(code).catch((err) => {
        req.log.error(err);
        throw new DefaultError('Authentication failed. Please try again.');
    });

    const profile = await getSpotifyProfile(tokens.access_token).catch((err) => {
        req.log.error(err);
        throw new DefaultError('Failed to fetch Spotify profile.');
    });

    const user = await upsertUser(profile, tokens).catch((err) => {
        req.log.error(err);
        throw new DefaultError('Failed to save user session.');
    });

    reply.setCookie('user_id', user.id, {
        ...COOKIE_OPTIONS,
        signed: true,
        maxAge: 60 * 60 * 24 * 30 // 30 dias
    });

    reply.redirect(FRONTEND_URL);
}

export async function logoutController(
    req: FastifyRequest,
    reply: FastifyReply
)
{
    reply.clearCookie('user_id', COOKIE_OPTIONS);

    return reply.send({ message: 'Logged out successfully' });
}