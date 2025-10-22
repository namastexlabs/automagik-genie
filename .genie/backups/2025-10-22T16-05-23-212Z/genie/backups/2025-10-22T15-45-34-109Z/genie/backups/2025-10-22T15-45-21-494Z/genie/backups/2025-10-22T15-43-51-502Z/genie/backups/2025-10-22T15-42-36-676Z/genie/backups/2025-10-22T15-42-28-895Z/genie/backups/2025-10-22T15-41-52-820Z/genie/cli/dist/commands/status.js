"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStatus = runStatus;
const forge_manager_1 = require("../lib/forge-manager");
const forge_stats_1 = require("../lib/forge-stats");
async function runStatus(parsed, _config, _paths) {
    const baseUrl = process.env.FORGE_BASE_URL || 'http://localhost:8887';
    const mcpPort = process.env.MCP_PORT || '8885';
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧞 GENIE STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    // Check Forge
    const forgeRunning = await (0, forge_manager_1.isForgeRunning)(baseUrl);
    const forgeStatus = forgeRunning ? '🟢 Running' : '🔴 Down';
    console.log(`📦 Forge Backend: ${forgeStatus}`);
    console.log(`   URL: ${baseUrl}`);
    if (forgeRunning) {
        const stats = await (0, forge_stats_1.collectForgeStats)(baseUrl);
        const statsDisplay = (0, forge_stats_1.formatStatsForDashboard)(stats);
        if (statsDisplay) {
            console.log(statsDisplay);
        }
    }
    console.log('');
    console.log(`📡 MCP Server:`);
    console.log(`   Expected URL: http://localhost:${mcpPort}/sse`);
    console.log(`   (Health check not implemented - check server logs)`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!forgeRunning) {
        console.log('');
        console.log('💡 To start Genie server:');
        console.log('   npx automagik-genie');
        console.log('');
    }
}
