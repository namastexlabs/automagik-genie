/**
 * HTTP Server Setup for Genie MCP with OAuth2 Authentication
 *
 * Uses official MCP SDK with Express for HTTP transport.
 * - OAuth2 Client Credentials flow for authentication
 * - Bearer token middleware from SDK
 * - Streamable HTTP transport from SDK
 */

import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { GenieOAuthProvider, OAuth2Config } from './oauth-provider.js';
import { handleTokenEndpoint, handleProtectedResourceMetadata } from './oauth2-endpoints.js';
import {
  handleOpenIDConfiguration,
  handleAuthorizationServerMetadata,
  handleClientRegistration,
  handleAuthorizationRequest,
  handleAuthorizationConsent,
  ensureDefaultChatGPTClient,
} from './oidc-endpoints.js';
import { randomUUID } from 'crypto';

export interface HttpServerOptions {
  server: McpServer;
  oauth2Config: OAuth2Config;
  port: number;
  onReady?: (url: string) => void;
}

/**
 * Start HTTP server with OAuth2 authentication using official MCP SDK
 */
export async function startHttpServer(options: HttpServerOptions): Promise<void> {
  const { server, oauth2Config, port, onReady } = options;
  const app = express();

  // Use public URL if behind tunnel (e.g., ngrok), otherwise localhost
  const serverUrl = process.env.MCP_PUBLIC_URL || `http://localhost:${port}`;

  // Debug mode (enabled via MCP_DEBUG=1 environment variable)
  const debugMode = process.env.MCP_DEBUG === '1' || process.env.DEBUG === '1';

  // ========================================
  // RAW REQUEST/RESPONSE LOGGER (FIRST - catches everything)
  // ========================================
  if (debugMode) {
    app.use((req: Request, res: Response, next: any) => {
      const timestamp = new Date().toISOString();
      const requestId = randomUUID().slice(0, 8);

      console.error(`\n${'='.repeat(80)}`);
      console.error(`🔍 [${timestamp}] [${requestId}] ${req.method} ${req.path}`);
      console.error(`${'='.repeat(80)}`);

      // Capture response status
      const originalSend = res.send;
      const originalJson = res.json;
      const originalStatus = res.status;

      let statusCode = 200;

      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      res.send = function(body: any) {
        console.error(`📤 [${requestId}] Response: ${statusCode} ${req.method} ${req.path}`);
        if (statusCode >= 400) {
          console.error(`   ⚠️  Error response body:`, typeof body === 'string' ? body : JSON.stringify(body));
        }
        return originalSend.call(this, body);
      };

      res.json = function(body: any) {
        console.error(`📤 [${requestId}] Response: ${statusCode || res.statusCode} ${req.method} ${req.path}`);
        if ((statusCode || res.statusCode) >= 400) {
          console.error(`   ⚠️  Error response body:`, JSON.stringify(body));
        }
        return originalJson.call(this, body);
      };

      next();
    });
  }

  // CORS middleware (allow ChatGPT to access OAuth endpoints)
  app.use((req: Request, res: Response, next: any) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  });

  // Body parser middleware with error handling
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Catch body-parser errors (invalid JSON, etc.)
  app.use((err: any, req: Request, res: Response, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      console.error(`❌ Body parser error on ${req.method} ${req.path}:`, err.message);
      console.error(`   Request body: ${(req as any).body || 'Unable to parse'}`);
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid JSON in request body'
      });
    }
    next(err);
  });

  // Debug logging middleware (logs all incoming requests)
  if (debugMode) {
    app.use((req: Request, res: Response, next: any) => {
      const timestamp = new Date().toISOString();
      console.error(`\n${'='.repeat(80)}`);
      console.error(`🔍 [${timestamp}] ${req.method} ${req.path}`);
      console.error(`${'='.repeat(80)}`);

      // Log query parameters
      if (Object.keys(req.query).length > 0) {
        console.error('📋 Query Parameters:');
        Object.entries(req.query).forEach(([key, value]) => {
          console.error(`   ${key}: ${value}`);
        });
      }

      // Log headers (filter sensitive ones)
      console.error('📨 Headers:');
      Object.entries(req.headers).forEach(([key, value]) => {
        if (key.toLowerCase() === 'authorization') {
          console.error(`   ${key}: ${String(value).substring(0, 20)}...`);
        } else {
          console.error(`   ${key}: ${value}`);
        }
      });

      // Log body (for POST/PUT requests)
      if (req.body && Object.keys(req.body).length > 0) {
        console.error('📦 Body:');
        console.error(JSON.stringify(req.body, null, 2));
      }

      console.error(`${'='.repeat(80)}\n`);
      next();
    });
  }

  // Create OAuth provider for token verification
  const oauthProvider = new GenieOAuthProvider(oauth2Config, serverUrl);

  // Ensure default ChatGPT client is registered
  ensureDefaultChatGPTClient(oauth2Config.clientId);

  // ========================================
  // Public Endpoints (no authentication)
  // ========================================

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'genie-mcp-server',
      transport: 'httpStream',
      auth: 'oauth2'
    });
  });

  // OpenID Connect Discovery (for ChatGPT)
  app.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
    handleOpenIDConfiguration(req, res, serverUrl);
  });

  // OAuth 2.0 Authorization Server Metadata (for MCP spec)
  app.get('/.well-known/oauth-authorization-server', (req: Request, res: Response) => {
    handleAuthorizationServerMetadata(req, res, serverUrl);
  });

  // OAuth2 protected resource metadata endpoint (RFC 9728) - kept for backward compatibility
  app.get('/.well-known/oauth-protected-resource', (req: Request, res: Response) => {
    handleProtectedResourceMetadata(req, res, serverUrl);
  });

  // OAuth2 token endpoint (client_credentials + authorization_code flows)
  app.post('/oauth/token', (req: Request, res: Response) => {
    handleTokenEndpoint(req, res, oauth2Config, serverUrl);
  });

  // OAuth2 dynamic client registration (RFC 7591)
  app.post('/oauth2/register', (req: Request, res: Response) => {
    handleClientRegistration(req, res);
  });

  // OAuth2 authorization endpoint (GET - shows consent page)
  app.get('/oauth2/authorize', (req: Request, res: Response) => {
    handleAuthorizationRequest(req, res);
  });

  // OAuth2 authorization consent endpoint (POST - processes user consent)
  app.post('/oauth2/authorize/consent', (req: Request, res: Response) => {
    handleAuthorizationConsent(req, res);
  });

  // ========================================
  // Protected Endpoints (OAuth2 required)
  // ========================================

  // MCP endpoint - protected by OAuth2 bearer token
  // IMPORTANT: Create a NEW transport for EACH request to prevent race conditions
  // (per MCP SDK docs - stateless mode prevents request ID collisions)
  app.post('/mcp', requireBearerAuth({
    verifier: oauthProvider,
    requiredScopes: ['mcp:read', 'mcp:write'],
    resourceMetadataUrl: `${serverUrl}/.well-known/oauth-protected-resource`
  }), async (req: Request, res: Response) => {
    try {
      // Create new transport for this request (stateless mode)
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless - no session management
        enableJsonResponse: true // Required for initialize handshake
      });

      // Close transport when response completes
      res.on('close', () => {
        transport.close();
      });

      // Connect server to this transport
      await server.server.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res, req.body);

      if (debugMode) {
        console.error('✅ POST /mcp handled successfully');
      }
    } catch (error: any) {
      console.error('❌ Error handling POST /mcp:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  });

  // SSE endpoint for streaming responses (also protected)
  // IMPORTANT: Create a NEW transport for EACH request to prevent race conditions
  app.get('/mcp', requireBearerAuth({
    verifier: oauthProvider,
    requiredScopes: ['mcp:read', 'mcp:write'],
    resourceMetadataUrl: `${serverUrl}/.well-known/oauth-protected-resource`
  }), async (req: Request, res: Response) => {
    try {
      // Create new transport for this request (stateless mode)
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless - no session management
        enableJsonResponse: true
      });

      // Close transport when response completes
      res.on('close', () => {
        transport.close();
      });

      // Connect server to this transport
      await server.server.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res);

      if (debugMode) {
        console.error('✅ GET /mcp (SSE) connection established');
      }
    } catch (error: any) {
      console.error('❌ Error handling GET /mcp:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  });

  // ========================================
  // Error handling
  // ========================================

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${req.method} ${req.path} not found`
    });
  });

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
      error: err.name || 'Internal Server Error',
      message: err.message || 'An unexpected error occurred'
    });
  });

  // ========================================
  // Start server
  // ========================================

  return new Promise((resolve) => {
    app.listen(port, () => {
      if (debugMode) {
        // Verbose mode - show everything
        console.error(`\n✅ Genie MCP Server started successfully`);
        console.error(`   HTTP Stream: ${serverUrl}/mcp`);
        console.error(`   SSE Stream:  ${serverUrl}/mcp (GET)`);
        console.error(`   Health:      ${serverUrl}/health`);
        console.error(`\n🔐 OAuth 2.0 Endpoints:`);
        console.error(`   ├─ OIDC Discovery:      ${serverUrl}/.well-known/openid-configuration`);
        console.error(`   ├─ Authorization:       ${serverUrl}/oauth2/authorize`);
        console.error(`   ├─ Token Exchange:      ${serverUrl}/oauth/token`);
        console.error(`   ├─ Client Registration: ${serverUrl}/oauth2/register`);
        console.error(`   └─ Resource Metadata:   ${serverUrl}/.well-known/oauth-protected-resource`);
        console.error(`\n🔑 Supported Flows:`);
        console.error(`   ├─ Authorization Code + PKCE (for ChatGPT)`);
        console.error(`   └─ Client Credentials (for machine-to-machine)`);
        console.error(`\n⚙️  OAuth Config:`);
        console.error(`   ├─ Issuer:       ${oauth2Config.issuer}`);
        console.error(`   ├─ Client ID:    ${oauth2Config.clientId}`);
        console.error(`   ├─ Client Secret: ${oauth2Config.clientSecret}`);
        console.error(`   ├─ Authorization PIN: ${oauth2Config.pin || 'NOT SET'}`);
        console.error(`   └─ Token Expiry: ${oauth2Config.tokenExpiry}s`);
        console.error(`\n📡 Transport: Streamable HTTP (MCP SDK official)`);
        console.error(`\n🔍 DEBUG MODE ENABLED`);
        console.error(`   All incoming requests will be logged`);
      } else {
        // Concise mode - minimal output (PIN already shown by genie-cli)
        // No additional logging - keeps terminal clean
      }

      if (onReady) {
        onReady(serverUrl);
      }

      resolve();
    });
  });
}
