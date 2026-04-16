import axios, { AxiosError } from "axios";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } from "../config/spotify";
import {
    SpotifyTokenSchema, SpotifyProfileSchema, RefreshTokenSchema,
    TopTracksSchema, TopArtistsSchema
} from "../schemas/spotify.schema";
import type { SpotifyTokenResponse, SpotifyProfile, TopTracks, TopArtists } from "../schemas/spotify.schema";

const AUTH_HEADER = `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`;

// Função auxiliar para fazer requisições com retry automático em caso de rate limit
async function spotifyApiRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                // Pega o tempo de espera do header retry-after (em segundos)
                const retryAfter = Number(error.response.headers['retry-after']) || 1;
                const waitTime = Math.max(retryAfter * 1000, 1000 * Math.pow(2, attempt));
                
                if (attempt < maxRetries) {
                    console.log(`Rate limit atingido. Aguardando ${waitTime}ms antes de tentar novamente...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
}

export async function exchangeCode(code: string): Promise<SpotifyTokenResponse>
{
    const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: SPOTIFY_REDIRECT_URI
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: AUTH_HEADER
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

export async function requestTokenRefresh(refreshToken: string): Promise<{ access_token: string; expires_in: number }>
{
    const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: AUTH_HEADER
            }
        }
    );

    return RefreshTokenSchema.parse(response.data);
}

export async function getTopTracks(accessToken: string, limit: number = 10, timeRange: string = 'medium_term'): Promise<TopTracks>
{
    return spotifyApiRequest(async () => {
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit, time_range: timeRange }
        });

        return TopTracksSchema.parse(response.data.items);
    });
}

export async function getTopArtists(accessToken: string, limit: number = 5, timeRange: string = 'medium_term'): Promise<TopArtists>
{
    return spotifyApiRequest(async () => {
        const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit, time_range: timeRange }
        });

        return TopArtistsSchema.parse(response.data.items);
    });
}