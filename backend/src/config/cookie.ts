const IS_PROD = process.env.NODE_ENV?.toLowerCase() === 'production';

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
};
