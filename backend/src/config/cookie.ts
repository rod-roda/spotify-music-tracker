const IS_PROD = process.env.NODE_ENV === 'production';

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' as const : 'lax' as const,
    path: '/',
};
