import axios from "axios";
import { randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { encrypt, decrypt } from "../lib/crypto";
import { requireEnv } from "../lib/env";
import { User } from "@prisma/client";

const CLIENT_ID = requireEnv('SPOTIFY_CLIENT_ID');
const CLIENT_SECRET = requireEnv('SPOTIFY_CLIENT_SECRET');
const REDIRECT_URI = requireEnv('SPOTIFY_REDIRECT_URI');

const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played'
].join(' ');

export function getAuthUrl(state: string): string
{
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        //show_dialog: 'true',
        state // Proteção CSRF
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

const SpotifyTokenSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number(),
});

const SpotifyProfileSchema = z.object({
    id: z.string(),
    display_name: z.string(),
    email: z.string().optional(),
    images: z.array(z.object({ url: z.string() })).optional(),
});

export type SpotifyTokenResponse = z.infer<typeof SpotifyTokenSchema>;
export type SpotifyProfile = z.infer<typeof SpotifyProfileSchema>;

export async function exchangeCode(code: string): Promise<SpotifyTokenResponse>
{
    const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
            }
        }
    );

    return SpotifyTokenSchema.parse(response.data);
}

export async function getSpotifyProfile(accessToken: string): Promise<SpotifyProfile>
{
    const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    return SpotifyProfileSchema.parse(response.data);
}

const RefreshTokenSchema = z.object({
    access_token: z.string(),
    expires_in: z.number(),
});

export async function refreshAccessToken(user: User): Promise<string>
{
    const refreshToken = decrypt(user.refreshToken);

    const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
            }
        }
    );

    const tokens = RefreshTokenSchema.parse(response.data);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            accessToken: encrypt(tokens.access_token),
            tokenExpiresAt,
        }
    });

    return tokens.access_token;
}

export async function getValidAccessToken(userId: string): Promise<string>
{
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const bufferMs = 60*1000;
    const isExpired = user.tokenExpiresAt.getTime() <= Date.now() + bufferMs;

    if (isExpired) {
        return refreshAccessToken(user);
    }

    return decrypt(user.accessToken);
}

export async function upsertUser(
    profile: SpotifyProfile,
    tokens: SpotifyTokenResponse
): Promise<User>
{
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    return prisma.user.upsert({
        where: { spotifyId: profile.id },
        update: {
            displayName: profile.display_name,
            email: profile.email,
            avatarUrl: profile.images?.[0]?.url ?? null,
            accessToken: encrypt(tokens.access_token),
            refreshToken: encrypt(tokens.refresh_token),
            tokenExpiresAt
        },
        create: {
            spotifyId: profile.id,
            displayName: profile.display_name,
            email: profile.email,
            avatarUrl: profile.images?.[0]?.url ?? null,
            accessToken: encrypt(tokens.access_token),
            refreshToken: encrypt(tokens.refresh_token),
            tokenExpiresAt
        }
    });
}