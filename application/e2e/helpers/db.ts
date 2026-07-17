import { request, APIRequestContext } from '@playwright/test';

const BACKEND_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Resets the database by calling the /api/test/reset endpoint.
 * This endpoint is only available when NODE_ENV is set to 'test'.
 */
export async function resetDatabase(requestContext?: APIRequestContext) {
  const req = requestContext || await request.newContext();
  const response = await req.post(`${BACKEND_URL}/api/test/reset`);
  if (!response.ok()) {
    throw new Error(`Failed to reset database: ${response.status()} ${await response.text()}`);
  }
}
