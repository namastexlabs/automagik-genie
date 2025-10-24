"use strict";
/**
 * OAuth2.1 Endpoints for Genie MCP Server
 *
 * Implements:
 * - /.well-known/oauth-protected-resource (RFC 9728)
 * - /oauth/token (client_credentials flow)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResourceMetadata = generateResourceMetadata;
exports.handleWellKnownEndpoint = handleWellKnownEndpoint;
exports.handleTokenEndpoint = handleTokenEndpoint;
const oauth2_utils_js_1 = require("./oauth2-utils.js");
/**
 * Generate protected resource metadata
 *
 * @param serverUrl - Base URL of the MCP server (e.g., 'http://localhost:8885')
 * @returns RFC 9728 compliant metadata
 */
function generateResourceMetadata(serverUrl) {
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
function handleWellKnownEndpoint(req, res, serverUrl) {
    const metadata = generateResourceMetadata(serverUrl);
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });
    res.end(JSON.stringify(metadata, null, 2));
}
/**
 * Parse Basic authentication header
 * Returns { username, password } or null if invalid
 */
function parseBasicAuth(authHeader) {
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
    }
    catch {
        return null;
    }
}
/**
 * Parse request body (application/x-www-form-urlencoded)
 * Returns parsed parameters or null if invalid
 */
async function parseFormBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const params = new URLSearchParams(body);
                const result = {};
                params.forEach((value, key) => {
                    result[key] = value;
                });
                resolve(result);
            }
            catch {
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
async function handleTokenEndpoint(req, res, oauth2Config, serverUrl) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        const errorResponse = {
            error: 'invalid_request',
            error_description: 'Token endpoint only accepts POST requests',
        };
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
        return;
    }
    // Parse client credentials from Authorization header OR request body
    let clientId = null;
    let clientSecret = null;
    // Try Authorization header first (RFC 6749 Section 2.3.1)
    const basicAuth = parseBasicAuth(req.headers.authorization);
    if (basicAuth) {
        clientId = basicAuth.username;
        clientSecret = basicAuth.password;
    }
    else {
        // Fall back to request body (RFC 6749 Section 2.3.1 - not recommended but allowed)
        const body = await parseFormBody(req);
        if (body) {
            clientId = body.client_id || null;
            clientSecret = body.client_secret || null;
        }
    }
    // Validate client credentials
    if (!clientId || !clientSecret) {
        const errorResponse = {
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
    const validCredentials = (0, oauth2_utils_js_1.validateClientCredentials)(clientId, clientSecret, oauth2Config.clientId, oauth2Config.clientSecret);
    if (!validCredentials) {
        const errorResponse = {
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
        const errorResponse = {
            error: 'unsupported_grant_type',
            error_description: 'Only client_credentials grant type is supported',
        };
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
        return;
    }
    try {
        // Generate JWT access token
        const accessToken = await (0, oauth2_utils_js_1.generateAccessToken)(oauth2Config.signingKey, oauth2Config.issuer, `${serverUrl}/mcp`, // Audience = resource identifier
        clientId, oauth2Config.tokenExpiry);
        const tokenResponse = {
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
    }
    catch (error) {
        const errorResponse = {
            error: 'server_error',
            error_description: 'Failed to generate access token',
        };
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
    }
}
