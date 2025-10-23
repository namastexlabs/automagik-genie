"use strict";
/**
 * Dashboard Command - Real-time terminal stats display
 *
 * Shows live statistics from Forge backend:
 * - Token usage (with real-time updates via WebSocket)
 * - Task counts and status
 * - Current activity
 * - Simple streak tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDashboard = runDashboard;
const forge_stats_1 = require("../lib/forge-stats");
const forge_manager_1 = require("../lib/forge-manager");
function loadDashboardStats() {
    const fs = require('fs');
    const path = require('path');
    const statsPath = path.join(process.cwd(), '.genie/state/dashboard-stats.json');
    if (!fs.existsSync(statsPath)) {
        return {
            lastCheck: new Date().toISOString(),
            dailyActivity: []
        };
    }
    try {
        const data = fs.readFileSync(statsPath, 'utf-8');
        return JSON.parse(data);
    }
    catch {
        return {
            lastCheck: new Date().toISOString(),
            dailyActivity: []
        };
    }
}
function saveDashboardStats(stats) {
    const fs = require('fs');
    const path = require('path');
    const statsPath = path.join(process.cwd(), '.genie/state/dashboard-stats.json');
    // Ensure directory exists
    const dir = path.dirname(statsPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}
function markDayActive(stats) {
    const today = new Date().toISOString().split('T')[0];
    const existing = stats.dailyActivity.find(d => d.date === today);
    if (!existing) {
        stats.dailyActivity.push({ date: today, active: true });
        // Keep only last 30 days
        stats.dailyActivity = stats.dailyActivity.slice(-30);
    }
    stats.lastCheck = new Date().toISOString();
    saveDashboardStats(stats);
}
function calculateStreak(activity) {
    if (activity.length === 0)
        return 0;
    const sorted = [...activity].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let checkDate = new Date(today);
    for (let i = 0; i < sorted.length; i++) {
        const dayStr = checkDate.toISOString().split('T')[0];
        const found = sorted.find(d => d.date === dayStr && d.active);
        if (found) {
            streak++;
        }
        else {
            break;
        }
        checkDate = new Date(checkDate.getTime() - 86400000); // Previous day
    }
    return streak;
}
function formatStats(stats, dashboardStats) {
    const lines = [];
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('🧞 GENIE DASHBOARD');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    if (!stats) {
        lines.push('⚠️  Unable to fetch stats (Forge may be offline)');
        lines.push('');
        lines.push('💡 Start Forge: npx automagik-genie');
        return lines.join('\n');
    }
    // Projects & Tasks
    lines.push(`📦 Projects: ${stats.projects.total}`);
    lines.push(`📝 Tasks: ${stats.tasks.total}`);
    // Tasks by status
    if (stats.tasks.total > 0) {
        const statusParts = [];
        if (stats.tasks.byStatus.inprogress > 0) {
            statusParts.push(`🔵 ${stats.tasks.byStatus.inprogress} in progress`);
        }
        if (stats.tasks.byStatus.todo > 0) {
            statusParts.push(`⚪ ${stats.tasks.byStatus.todo} todo`);
        }
        if (stats.tasks.byStatus.done > 0) {
            statusParts.push(`✅ ${stats.tasks.byStatus.done} done`);
        }
        if (statusParts.length > 0) {
            statusParts.forEach(part => lines.push(`   ${part}`));
        }
    }
    lines.push('');
    // Attempts/Execution
    if (stats.attempts.total > 0) {
        lines.push(`⚙️  Attempts: ${stats.attempts.total} total`);
        const attemptParts = [];
        if (stats.attempts.running > 0) {
            attemptParts.push(`🔴 ${stats.attempts.running} running`);
        }
        if (stats.attempts.paused > 0) {
            attemptParts.push(`⏸️  ${stats.attempts.paused} paused`);
        }
        if (stats.attempts.completed > 0) {
            attemptParts.push(`✅ ${stats.attempts.completed} completed`);
        }
        if (stats.attempts.failed > 0) {
            attemptParts.push(`❌ ${stats.attempts.failed} failed`);
        }
        if (attemptParts.length > 0) {
            attemptParts.forEach(part => lines.push(`   ${part}`));
        }
    }
    else {
        lines.push(`⚙️  Attempts: None active`);
    }
    lines.push('');
    // Token usage
    if (stats.tokens && stats.tokens.total > 0) {
        const totalK = (stats.tokens.total / 1000).toFixed(1);
        const inputK = (stats.tokens.input / 1000).toFixed(1);
        const outputK = (stats.tokens.output / 1000).toFixed(1);
        const costDisplay = stats.tokens.costUsd > 0 ? ` ($${stats.tokens.costUsd.toFixed(3)})` : '';
        lines.push(`💬 Tokens: ${totalK}k total${costDisplay}`);
        lines.push(`   📥 ${inputK}k input`);
        lines.push(`   📤 ${outputK}k output`);
        if (stats.tokens.processCount > 0) {
            lines.push(`   🔢 ${stats.tokens.processCount} processes tracked`);
        }
    }
    else {
        lines.push(`💬 Tokens: No usage recorded`);
    }
    lines.push('');
    // Streak tracking
    const streak = calculateStreak(dashboardStats.dailyActivity);
    if (streak > 0) {
        lines.push(`🔥 Streak: ${streak} day${streak === 1 ? '' : 's'}`);
    }
    else {
        lines.push(`🔥 Streak: Start your streak today!`);
    }
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('💡 Commands:');
    lines.push('   genie status     - Quick status check');
    lines.push('   genie dashboard  - This live dashboard');
    lines.push('');
    return lines.join('\n');
}
async function runDashboard(parsed, _config, _paths) {
    const baseUrl = process.env.FORGE_BASE_URL || 'http://localhost:8887';
    const watch = parsed.commandArgs.includes('--watch');
    // Load/update dashboard stats
    const dashboardStats = loadDashboardStats();
    markDayActive(dashboardStats);
    // Check if Forge is running
    const forgeRunning = await (0, forge_manager_1.isForgeRunning)(baseUrl);
    if (!forgeRunning) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🧞 GENIE DASHBOARD');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('🔴 Forge backend is offline');
        console.log('');
        console.log('💡 Start Forge: npx automagik-genie');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
    }
    if (!watch) {
        // One-time fetch
        const stats = await (0, forge_stats_1.collectForgeStats)(baseUrl);
        const output = formatStats(stats, dashboardStats);
        console.log(output);
        return;
    }
    // Watch mode: Real-time updates via WebSocket
    console.clear();
    console.log('🧞 GENIE DASHBOARD (Live Mode)');
    console.log('Press Ctrl+C to exit\n');
    let currentStats = await (0, forge_stats_1.collectForgeStats)(baseUrl);
    console.log(formatStats(currentStats, dashboardStats));
    // Connect to Forge WebSocket for token updates
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    // Try to connect to execution process WebSocket for real-time token updates
    // Note: This requires knowing a process ID - for now, just poll every 2 seconds
    const interval = setInterval(async () => {
        currentStats = await (0, forge_stats_1.collectForgeStats)(baseUrl);
        console.clear();
        console.log('🧞 GENIE DASHBOARD (Live Mode)');
        console.log('Press Ctrl+C to exit\n');
        console.log(formatStats(currentStats, dashboardStats));
    }, 2000);
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\n👋 Dashboard closed');
        process.exit(0);
    });
}
