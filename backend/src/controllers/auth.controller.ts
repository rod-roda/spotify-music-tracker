import { FastifyRequest, FastifyReply } from "fastify";
import { getAuthUrl, generateCSRFState, validateCSRFState, upsertUser } from "../services/auth.services";
import { exchangeCode, getSpotifyProfile } from "../services/spotify.services";
import { requireEnv } from "../config/env";
import { SPOTIFY_REDIRECT_URI } from "../config/spotify";
import { COOKIE_OPTIONS } from "../config/cookie";
import DefaultError from "../errors/DefaultError";
import BadRequest from "../errors/BadRequest";
import type { CallbackQuery } from "../schemas/route.schemas";

const FRONTEND_URL = requireEnv('FRONTEND_URL');

export async function loginController(req: FastifyRequest, reply: FastifyReply)
{
    // Garante que o cookie será setado no mesmo domínio do callback
    // (Spotify exige 127.0.0.1, não aceita localhost)
    const callbackUrl = new URL(SPOTIFY_REDIRECT_URI);
    const currentHostname = req.hostname; // Fastify retorna sem porta

    if (currentHostname !== callbackUrl.hostname) {
        return reply.redirect(`${callbackUrl.origin}/auth/login`);
    }

    const state = generateCSRFState();
    
    reply.setCookie('oauth_state', state, {
        ...COOKIE_OPTIONS,
        signed: true,
        maxAge: 60 * 10 // 10 minutos
    });

    const url = getAuthUrl(state);
    reply.redirect(url);
}

export async function callbackController(
    req: FastifyRequest,
    reply: FastifyReply
) 
{
    // JSON Schema valida em runtime, fazemos type assertion aqui
    const { code, error, state } = req.query as CallbackQuery;

    if(error || !code) {
        throw new BadRequest('Auth denied or missing code');
    }

    const savedState = req.unsignCookie(req.cookies.oauth_state ?? '');
    if (!savedState.valid || !validateCSRFState(state, savedState.value ?? undefined)) {
        throw new DefaultError('Invalid state (CSRF protection)', 403);
    }

    reply.clearCookie('oauth_state', { path: '/' });

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

    reply.redirect(`${FRONTEND_URL}/auth/callback`);
}

export async function logoutController(
    req: FastifyRequest,
    reply: FastifyReply
)
{
    reply.clearCookie('user_id', COOKIE_OPTIONS);

    return reply.send({ message: 'Logged out successfully' });
}