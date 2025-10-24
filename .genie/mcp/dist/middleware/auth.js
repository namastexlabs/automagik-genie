"use strict";
/**
 * Authentication Middleware for Genie MCP Server
 *
 * Supports dual authentication modes:
 * 1. Legacy Bearer tokens (simple token comparison)
 * 2. OAuth2.1 JWT tokens (signed JWT with verification)
 *
 * Allows /health and OAuth2 endpoints without authentication
 * Returns 401 Unauthorized for missing or invalid tokens
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = createAuthMiddleware;
exports.attachAuthMiddleware = attachAuthMiddleware;
exports.validateHttpAuth = validateHttpAuth;
const oauth2_utils_js_1 = require("../lib/oauth2-utils.js");
/**
 * Validate token (supports both legacy Bearer and OAuth2 JWT)
 * Returns true if valid, false otherwise
 */
async function validateToken(token, storedToken, oauth2Config, serverUrl) {
    // Check if token is a JWT
    if ((0, oauth2_utils_js_1.isJWT)(token)) {
        // OAuth2 JWT token validation
        if (!oauth2Config || !oauth2Config.enabled || !serverUrl) {
            // OAuth2 not configured, reject JWT tokens
            return false;
        }
        try {
            const payload = await (0, oauth2_utils_js_1.verifyAccessToken)(token, oauth2Config.publicKey, oauth2Config.issuer, `${serverUrl}/mcp` // Expected audience
            );
            return payload !== null; // Valid if payload decoded successfully
        }
        catch {
            return false;
        }
    }
    // Legacy Bearer token validation (constant-time comparison)
    try {
        if (token.length === storedToken.length) {
            const crypto = require('crypto');
            return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
        }
    }
    catch {
        return false;
    }
    return false;
}
/**
 * Create authentication middleware
 * Validates Bearer token on all requests except public paths
 * Supports both legacy tokens and OAuth2 JWTs
 */
function createAuthMiddleware(options) {
    const { storedToken, publicPaths = ['/health', '/.well-known/oauth-protected-resource', '/oauth/token'], oauth2Config, serverUrl } = options;
    return async function authMiddleware(req, res, next) {
        // Check if path is public (no auth required)
        const pathname = req.url?.split('?')[0] || '';
        if (publicPaths.includes(pathname)) {
            if (next)
                next();
            return;
        }
        // Extract Authorization header
        const authHeader = req.headers.authorization;
        // Check if Authorization header exists
        if (!authHeader) {
            const wwwAuth = oauth2Config?.enabled
                ? `Bearer realm="Genie MCP Server", error="invalid_token", error_description="Missing Authorization header"`
                : undefined;
            res.writeHead(401, {
                'Content-Type': 'application/json',
                ...(wwwAuth && { 'WWW-Authenticate': wwwAuth }),
            });
            res.end(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }));
            return;
        }
        // Check if it's a Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Invalid Authorization scheme' }));
            return;
        }
        // Extract token
        const token = authHeader.slice(7);
        // Validate token (supports both legacy and OAuth2 JWT)
        const isValid = await validateToken(token, storedToken, oauth2Config, serverUrl);
        if (!isValid) {
            const wwwAuth = oauth2Config?.enabled
                ? `Bearer realm="Genie MCP Server", error="invalid_token", error_description="Token validation failed"`
                : undefined;
            res.writeHead(401, {
                'Content-Type': 'application/json',
                ...(wwwAuth && { 'WWW-Authenticate': wwwAuth }),
            });
            res.end(JSON.stringify({ error: 'Unauthorized: Invalid token' }));
            return;
        }
        // Token is valid, proceed
        if (next)
            next();
    };
}
/**
 * Attach auth middleware to Express-like router/app
 */
function attachAuthMiddleware(app, options) {
    const middleware = createAuthMiddleware(options);
    // For Express-like apps
    if (app.use && typeof app.use === 'function') {
        app.use((req, res, next) => {
            middleware(req, res, next);
        });
    }
}
/**
 * Create a simple HTTP request handler that validates auth
 * Returns true if auth is valid, false otherwise
 * Automatically sends 401 response if auth fails
 * Supports both legacy Bearer tokens and OAuth2 JWTs
 */
async function validateHttpAuth(req, res, storedToken, publicPaths = ['/health', '/.well-known/oauth-protected-resource', '/oauth/token'], oauth2Config, serverUrl) {
    const pathname = req.url?.split('?')[0] || '';
    // Public paths bypass auth
    if (publicPaths.includes(pathname)) {
        return true;
    }
    // Extract and validate token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const wwwAuth = oauth2Config?.enabled
            ? `Bearer realm="Genie MCP Server", error="invalid_token", error_description="Missing or invalid Authorization header"`
            : undefined;
        res.writeHead(401, {
            'Content-Type': 'application/json',
            ...(wwwAuth && { 'WWW-Authenticate': wwwAuth }),
        });
        res.end(JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }));
        return false;
    }
    const token = authHeader.slice(7);
    // Validate token (supports both legacy and OAuth2 JWT)
    const isValid = await validateToken(token, storedToken, oauth2Config, serverUrl);
    if (!isValid) {
        const wwwAuth = oauth2Config?.enabled
            ? `Bearer realm="Genie MCP Server", error="invalid_token", error_description="Token validation failed"`
            : undefined;
        res.writeHead(401, {
            'Content-Type': 'application/json',
            ...(wwwAuth && { 'WWW-Authenticate': wwwAuth }),
        });
        res.end(JSON.stringify({ error: 'Unauthorized: Invalid token' }));
        return false;
    }
    return true;
}
