import { FastifyRequest, FastifyReply } from "fastify";
import { getAuthUrl, generateCSRFState, validateCSRFState, exchangeCode, getSpotifyProfile, upsertUser } from "../services/auth.services";
import { requireEnv } from "../lib/env";

const SPOTIFY_REDIRECT_URI = requireEnv('SPOTIFY_REDIRECT_URI');
const FRONTEND_URL = requireEnv('FRONTEND_URL');
const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
};

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
    req: FastifyRequest<{ Querystring: { code?: string; error?: string; state?: string } }>,
    reply: FastifyReply
) 
{
    const { code, error, state } = req.query;

    if(error || !code) {
        return reply.status(400).send({ error: 'Auth denied or missing code' });
    }

    const savedState = req.unsignCookie(req.cookies.oauth_state ?? '');
    if (!savedState.valid || !validateCSRFState(state, savedState.value ?? undefined)) {
        return reply.status(403).send({ error: 'Invalid state (CSRF protection)' });
    }

    reply.clearCookie('oauth_state', { path: '/' });

    try {
        const tokens = await exchangeCode(code);
        const profile = await getSpotifyProfile(tokens.access_token);
        const user = await upsertUser(profile, tokens);

        reply.setCookie('user_id', user.id, {
            ...COOKIE_OPTIONS,
            signed: true,
            maxAge: 60 * 60 * 24 * 30 // 30 dias
        });

        reply.redirect(`${FRONTEND_URL}/callback`);
    } catch (err) {
        req.log.error(err, 'OAuth callback failed');
        return reply.status(500).send({ error: 'Authentication failed. Please try again.' });
    }
}