"use strict";
/**
 * Configuration Manager for Genie MCP Server
 *
 * Handles loading and saving of ~/.genie/config.yaml with support for:
 * - MCP auth tokens
 * - Tunnel configuration
 * - Server settings
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.loadAuthToken = loadAuthToken;
exports.saveConfig = saveConfig;
exports.createDefaultConfig = createDefaultConfig;
exports.createDefaultConfigAsync = createDefaultConfigAsync;
exports.loadOrCreateConfig = loadOrCreateConfig;
exports.getConfigPath = getConfigPath;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const os_1 = __importDefault(require("os"));
const CONFIG_FILE = path_1.default.join(os_1.default.homedir(), '.genie', 'config.yaml');
/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
    const configDir = path_1.default.dirname(CONFIG_FILE);
    if (!fs_1.default.existsSync(configDir)) {
        fs_1.default.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }
}
/**
 * Load configuration from ~/.genie/config.yaml
 * Returns null if file doesn't exist
 */
function loadConfig() {
    try {
        if (!fs_1.default.existsSync(CONFIG_FILE)) {
            return null;
        }
        const content = fs_1.default.readFileSync(CONFIG_FILE, 'utf8');
        const config = yaml_1.default.parse(content);
        // Validate required structure
        if (!config.mcp || !config.mcp.auth || !config.mcp.auth.token) {
            throw new Error('Invalid config: missing mcp.auth.token');
        }
        return config;
    }
    catch (error) {
        throw new Error(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Load auth token from config, or return null if not configured
 */
function loadAuthToken() {
    try {
        const config = loadConfig();
        return config?.mcp?.auth?.token || null;
    }
    catch {
        return null;
    }
}
/**
 * Save configuration to ~/.genie/config.yaml
 * Sets restrictive permissions (0o600) for security
 */
function saveConfig(config) {
    try {
        ensureConfigDir();
        // Convert to YAML
        const yaml = yaml_1.default.stringify(config);
        // Write with restrictive permissions for security
        fs_1.default.writeFileSync(CONFIG_FILE, yaml, { mode: 0o600 });
    }
    catch (error) {
        throw new Error(`Failed to save config: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Create default configuration with generated auth token
 */
function createDefaultConfig(ngrokToken, enableOAuth2) {
    const { generateToken } = require('./auth-token');
    const config = {
        mcp: {
            auth: {
                token: generateToken(),
                created: new Date().toISOString()
            },
            tunnel: {
                enabled: !!ngrokToken,
                provider: 'ngrok',
                token: ngrokToken || null
            },
            server: {
                port: 8885,
                transport: 'httpStream'
            }
        }
    };
    // Add OAuth2 configuration if requested
    if (enableOAuth2) {
        const oauth2Utils = require('./oauth2-utils');
        const { clientId, clientSecret } = oauth2Utils.generateClientCredentials();
        // Generate keys synchronously using promise wrapper
        let privateKey;
        let publicKey;
        // Note: This is a workaround for sync context - in real usage this should be async
        const keyPair = oauth2Utils.generateKeyPair();
        if (keyPair instanceof Promise) {
            throw new Error('Cannot generate OAuth2 keys synchronously. Use createDefaultConfigAsync instead.');
        }
        config.mcp.auth.oauth2 = {
            enabled: true,
            clientId,
            clientSecret,
            signingKey: '', // Will be set by async version
            publicKey: '', // Will be set by async version
            tokenExpiry: 3600, // 1 hour
            issuer: 'genie-mcp-server'
        };
    }
    return config;
}
/**
 * Create default configuration with OAuth2 support (async version)
 */
async function createDefaultConfigAsync(ngrokToken, enableOAuth2) {
    const { generateToken } = require('./auth-token');
    const config = {
        mcp: {
            auth: {
                token: generateToken(),
                created: new Date().toISOString()
            },
            tunnel: {
                enabled: !!ngrokToken,
                provider: 'ngrok',
                token: ngrokToken || null
            },
            server: {
                port: 8885,
                transport: 'httpStream'
            }
        }
    };
    // Add OAuth2 configuration if requested
    if (enableOAuth2) {
        const oauth2Utils = require('./oauth2-utils');
        const { clientId, clientSecret } = oauth2Utils.generateClientCredentials();
        const { privateKey, publicKey } = await oauth2Utils.generateKeyPair();
        config.mcp.auth.oauth2 = {
            enabled: true,
            clientId,
            clientSecret,
            signingKey: privateKey,
            publicKey: publicKey,
            tokenExpiry: 3600, // 1 hour
            issuer: 'genie-mcp-server'
        };
    }
    return config;
}
/**
 * Load or create config
 * Returns existing config if present, creates default if missing
 */
function loadOrCreateConfig(ngrokToken) {
    try {
        const existing = loadConfig();
        if (existing) {
            return existing;
        }
    }
    catch {
        // Config exists but is invalid, create new
    }
    const config = createDefaultConfig(ngrokToken);
    saveConfig(config);
    return config;
}
/**
 * Get config file path (for display/debugging)
 */
function getConfigPath() {
    return CONFIG_FILE;
}
