const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set in production');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dev_only_insecure_secret';

// Short-lived access token (carried in the `token` cookie) plus a longer-lived
// refresh token (carried in the `refreshToken` cookie, scoped to /api/auth/refresh)
// used to silently mint new access tokens without keeping a 24h token alive.
export const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS) || 7 * 24 * 60 * 60;
