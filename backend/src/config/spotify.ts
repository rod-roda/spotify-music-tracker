import { requireEnv } from "./env";

export const SPOTIFY_CLIENT_ID = requireEnv('SPOTIFY_CLIENT_ID');
export const SPOTIFY_CLIENT_SECRET = requireEnv('SPOTIFY_CLIENT_SECRET');
export const SPOTIFY_REDIRECT_URI = requireEnv('SPOTIFY_REDIRECT_URI');

export const SPOTIFY_SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played'
].join(' ');
