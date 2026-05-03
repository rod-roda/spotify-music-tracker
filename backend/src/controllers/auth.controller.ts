import { FastifyRequest, FastifyReply } from "fastify";
import { getAuthUrl, generateCSRFState, saveCSRFState, consumeCSRFState, upsertUser, saveAuthToken, consumeAuthToken } from "../services/auth.services";
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
        throw new BadRequest('Autorização negada ou código ausente');
    }

    const isValid = await consumeCSRFState(state);
    if (!isValid) {
        throw new DefaultError('Estado inválido (proteção CSRF)', 403);
    }

    const tokens = await exchangeCode(code).catch((err) => {
        req.log.error(err);
        throw new DefaultError('Falha na autenticação. Tente novamente.');
    });

    const profile = await getSpotifyProfile(tokens.access_token).catch((err) => {
        req.log.error(err);
        throw new DefaultError('Falha ao buscar perfil do Spotify.');
    });

    const user = await upsertUser(profile, tokens).catch((err) => {
        req.log.error(err);
        throw new DefaultError('Falha ao salvar sessão do usuário.');
    });

    const token = await saveAuthToken(user.id);

    reply.redirect(`${FRONTEND_URL}/callback?token=${token}`);
}

export async function sessionController(
    req: FastifyRequest<{ Querystring: { token?: string } }>,
    reply: FastifyReply
)
{
    const { token } = req.query;
    const userId = await consumeAuthToken(token);

    if (!userId) {
        throw new DefaultError('Token inválido ou expirado', 401);
    }

    reply.setCookie('user_id', userId, {
        ...COOKIE_OPTIONS,
        signed: true,
        maxAge: 60 * 60 * 24 * 30 // 30 dias
    });

    return reply.send({ ok: true });
}

export async function logoutController(
    req: FastifyRequest,
    reply: FastifyReply
)
{
    reply.clearCookie('user_id', COOKIE_OPTIONS);

    return reply.send({ message: 'Logged out successfully' });
}