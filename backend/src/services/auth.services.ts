import { randomBytes, timingSafeEqual } from "crypto";
import { User } from "@prisma/client";
import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, SPOTIFY_SCOPES } from "../config/spotify";
import { findUserById, updateUser, upsertUserBySpotifyId } from "../repositories/user.repository";
import { requestTokenRefresh } from "./spotify.services";
import type { SpotifyProfile, SpotifyTokenResponse, RefreshTokenResponse } from "../schemas/spotify.schema";
import { encrypt, decrypt } from "../utils/crypto";

export function getAuthUrl(state: string): string
{
    const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: SPOTIFY_REDIRECT_URI,
        scope: SPOTIFY_SCOPES,
        state
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export function generateCSRFState(): string
{
    return randomBytes(16).toString('hex');
}

export function validateCSRFState(state?: string, savedState?: string): boolean
{
    if (!state || !savedState || state.length !== savedState.length) return false;

    return timingSafeEqual(
        Buffer.from(state, 'utf8'),
        Buffer.from(savedState, 'utf8')
    );
}

export async function getValidAccessToken(userId: string): Promise<string>
{
    const user = await findUserById(userId);

    const bufferMs = 60 * 1000;
    const isExpired = user.tokenExpiresAt.getTime() <= Date.now() + bufferMs;

    if (isExpired) {
        return refreshAccessToken(user);
    }

    return decrypt(user.accessToken);
}

async function refreshAccessToken(user: User): Promise<string>
{
    const refreshToken = decrypt(user.refreshToken);
    const tokens = await requestTokenRefresh(refreshToken);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await updateUser(user.id, {
        accessToken: encrypt(tokens.access_token),
        tokenExpiresAt,
        ...(tokens.refresh_token && {
            refreshToken: encrypt(tokens.refresh_token)
        })
    });

    return tokens.access_token;
}

export async function upsertUser(
    profile: SpotifyProfile,
    tokens: SpotifyTokenResponse
): Promise<User>
{
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    return upsertUserBySpotifyId(profile.id, {
        displayName: profile.display_name,
        email: profile.email,
        avatarUrl: profile.images?.[0]?.url ?? null,
        accessToken: encrypt(tokens.access_token),
        refreshToken: encrypt(tokens.refresh_token),
        tokenExpiresAt
    });
}