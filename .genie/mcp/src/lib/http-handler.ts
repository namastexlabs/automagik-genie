/**
 * Custom HTTP Handler for OAuth2 Endpoints
 *
 * Handles OAuth2-specific routes that need to run outside of MCP protocol
 * This wraps FastMCP's HTTP server to add custom routes
 */

import { IncomingMessage, ServerResponse } from 'http';
import { OAuth2Config } from '../types/oauth2.js';
import { handleWellKnownEndpoint, handleTokenEndpoint } from './oauth2-endpoints.js';

/**
 * Route OAuth2-specific HTTP requests
 * Returns true if handled, false if should pass to FastMCP
 */
export async function routeOAuth2Request(
  req: IncomingMessage,
  res: ServerResponse,
  oauth2Config: OAuth2Config | undefined,
  serverUrl: string
): Promise<boolean> {
  const pathname = req.url?.split('?')[0] || '';

  // Handle /.well-known/oauth-protected-resource
  if (pathname === '/.well-known/oauth-protected-resource') {
    handleWellKnownEndpoint(req, res, serverUrl);
    return true;
  }

  // Handle /oauth/token (only if OAuth2 is enabled)
  if (pathname === '/oauth/token') {
    if (!oauth2Config || !oauth2Config.enabled) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'OAuth2 not enabled' }));
      return true;
    }

    await handleTokenEndpoint(req, res, oauth2Config, serverUrl);
    return true;
  }

  // Not an OAuth2 route, pass to FastMCP
  return false;
}
