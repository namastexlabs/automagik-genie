/**
 * OAuth2.1 Endpoints for Genie MCP Server
 *
 * Implements:
 * - /.well-known/oauth-protected-resource (RFC 9728)
 * - /oauth/token (client_credentials flow)
 */

import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { OAuth2Config } from '../types/oauth2.js';
import { generateAccessToken, validateClientCredentials } from './oauth2-utils.js';

/**
 * OAuth2.1 Protected Resource Metadata (RFC 9728)
 * Advertises authorization server and token requirements
 */
export interface ProtectedResourceMetadata {
  resource: string; // Resource identifier URL
  authorization_servers: string[]; // Authorization servers that can issue tokens
  bearer_methods_supported: string[]; // Supported token presentation methods
  resource_documentation?: string; // Optional documentation URL
  scopes_supported?: string[]; // Supported scopes
  resource_signing_alg_values_supported?: string[]; // Supported signing algorithms
}

/**
 * Generate protected resource metadata
 *
 * @param serverUrl - Base URL of the MCP server (e.g., 'http://localhost:8885')
 * @returns RFC 9728 compliant metadata
 */
export function generateResourceMetadata(serverUrl: string): ProtectedResourceMetadata {
  return {
    resource: `${serverUrl}/mcp`,
    authorization_servers: [`${serverUrl}`], // Self-issued tokens
    bearer_methods_supported: ['header'], // Authorization: Bearer <token>
    scopes_supported: ['mcp:read', 'mcp:write'],
    resource_signing_alg_values_supported: ['RS256'],
  };
}

/**
 * Handle /.well-known/oauth-protected-resource endpoint
 * Returns metadata as JSON per RFC 9728
 */
export function handleWellKnownEndpoint(
  req: IncomingMessage,
  res: ServerResponse,
  serverUrl: string
): void {
  const metadata = generateResourceMetadata(serverUrl);

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  });
  res.end(JSON.stringify(metadata, null, 2));
}

/**
 * OAuth2.1 Token Response (RFC 6749 Section 5.1)
 */
interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope?: string;
}

/**
 * OAuth2.1 Error Response (RFC 6749 Section 5.2)
 */
interface TokenErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * Parse Basic authentication header
 * Returns { username, password } or null if invalid
 */
function parseBasicAuth(authHeader: string | undefined): { username: string; password: string } | null {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64Credentials = authHeader.slice(6); // Remove 'Basic '
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':', 2);

    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch {
    return null;
  }
}

/**
 * Parse request body (application/x-www-form-urlencoded)
 * Returns parsed parameters or null if invalid
 */
async function parseFormBody(req: IncomingMessage): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const params = new URLSearchParams(body);
        const result: Record<string, string> = {};

        params.forEach((value, key) => {
          result[key] = value;
        });

        resolve(result);
      } catch {
        resolve(null);
      }
    });

    req.on('error', () => {
      resolve(null);
    });
  });
}

/**
 * Handle /oauth/token endpoint (client_credentials flow)
 * Implements RFC 6749 Section 4.4
 */
export async function handleTokenEndpoint(
  req: IncomingMessage,
  res: ServerResponse,
  oauth2Config: OAuth2Config,
  serverUrl: string
): Promise<void> {
  // Only accept POST requests
  if (req.method !== 'POST') {
    const errorResponse: TokenErrorResponse = {
      error: 'invalid_request',
      error_description: 'Token endpoint only accepts POST requests',
    };

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(errorResponse));
    return;
  }

  // Parse client credentials from Authorization header OR request body
  let clientId: string | null = null;
  let clientSecret: string | null = null;

  // Try Authorization header first (RFC 6749 Section 2.3.1)
  const basicAuth = parseBasicAuth(req.headers.authorization);
  if (basicAuth) {
    clientId = basicAuth.username;
    clientSecret = basicAuth.password;
  } else {
    // Fall back to request body (RFC 6749 Section 2.3.1 - not recommended but allowed)
    const body = await parseFormBody(req);
    if (body) {
      clientId = body.client_id || null;
      clientSecret = body.client_secret || null;
    }
  }

  // Validate client credentials
  if (!clientId || !clientSecret) {
    const errorResponse: TokenErrorResponse = {
      error: 'invalid_client',
      error_description: 'Client authentication failed: missing credentials',
    };

    res.writeHead(401, {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Basic realm="Genie MCP Server"',
    });
    res.end(JSON.stringify(errorResponse));
    return;
  }

  // Verify client credentials against config
  const validCredentials = validateClientCredentials(
    clientId,
    clientSecret,
    oauth2Config.clientId,
    oauth2Config.clientSecret
  );

  if (!validCredentials) {
    const errorResponse: TokenErrorResponse = {
      error: 'invalid_client',
      error_description: 'Client authentication failed: invalid credentials',
    };

    res.writeHead(401, {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Basic realm="Genie MCP Server"',
    });
    res.end(JSON.stringify(errorResponse));
    return;
  }

  // Parse request body for grant_type validation
  const body = await parseFormBody(req);
  if (!body || body.grant_type !== 'client_credentials') {
    const errorResponse: TokenErrorResponse = {
      error: 'unsupported_grant_type',
      error_description: 'Only client_credentials grant type is supported',
    };

    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(errorResponse));
    return;
  }

  try {
    // Generate JWT access token
    const accessToken = await generateAccessToken(
      oauth2Config.signingKey,
      oauth2Config.issuer,
      `${serverUrl}/mcp`, // Audience = resource identifier
      clientId,
      oauth2Config.tokenExpiry
    );

    const tokenResponse: TokenResponse = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: oauth2Config.tokenExpiry,
      scope: 'mcp:read mcp:write',
    };

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    });
    res.end(JSON.stringify(tokenResponse));
  } catch (error) {
    const errorResponse: TokenErrorResponse = {
      error: 'server_error',
      error_description: 'Failed to generate access token',
    };

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(errorResponse));
  }
}
