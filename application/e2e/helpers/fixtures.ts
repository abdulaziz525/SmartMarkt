import { APIRequestContext } from '@playwright/test';

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';

export interface UserSession {
  token: string;
  storeId: string;
  organizationId: string;
  userId: string;
  role: string;
  username: string;
  fullName: string;
  headers: Record<string, string>;
}

/**
 * Extract token from set-cookie header.
 */
export function extractTokenFromCookie(setCookieHeader?: string): string {
  if (!setCookieHeader) return '';
  const match = setCookieHeader.match(/token=([^;]+)/);
  return match ? match[1] : '';
}

/**
 * Register a new user using the new multi-step signup payload structure.
 */
export async function signupUser(request: APIRequestContext, payload: Record<string, any>) {
  return await request.post(`${BACKEND_URL}/api/auth/signup`, {
    data: payload
  });
}

/**
 * Register and authenticate a user, returning their session information and headers.
 */
export async function signupAndAuthenticate(
  request: APIRequestContext,
  payload: Record<string, any>
): Promise<UserSession> {
  const response = await signupUser(request, payload);
  if (!response.ok()) {
    throw new Error(`Signup failed with status ${response.status()}: ${await response.text()}`);
  }

  const data = await response.json();
  const setCookie = response.headers()['set-cookie'];
  const token = extractTokenFromCookie(setCookie);

  const storeId = data.store_id || '';
  const organizationId = data.organization_id || '';

  const headers = {
    'Cookie': `token=${token}`,
    'x-store-id': storeId
  };

  return {
    token,
    storeId,
    organizationId,
    userId: data.id,
    role: data.role,
    username: data.username,
    fullName: data.nameAr || payload.fullName,
    headers
  };
}

/**
 * Authenticate an existing user via login.
 */
export async function loginUser(request: APIRequestContext, payload: Record<string, any>) {
  return await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: payload
  });
}

/**
 * Log in a user and return their session details.
 */
export async function loginAndAuthenticate(
  request: APIRequestContext,
  payload: Record<string, any>,
  storeIdOverride?: string
): Promise<UserSession> {
  const response = await loginUser(request, payload);
  if (!response.ok()) {
    throw new Error(`Login failed with status ${response.status()}: ${await response.text()}`);
  }

  const data = await response.json();
  const setCookie = response.headers()['set-cookie'];
  const token = extractTokenFromCookie(setCookie);

  const storeId = storeIdOverride || data.store_id || '';
  const organizationId = data.organization_id || '';

  const headers = {
    'Cookie': `token=${token}`,
    'x-store-id': storeId
  };

  return {
    token,
    storeId,
    organizationId,
    userId: data.id,
    role: data.role,
    username: data.username,
    fullName: data.nameAr || '',
    headers
  };
}

/**
 * Perform logout request.
 */
export async function logoutUser(request: APIRequestContext, headers: Record<string, string>) {
  return await request.post(`${BACKEND_URL}/api/auth/logout`, {
    headers
  });
}
