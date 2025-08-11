#!/usr/bin/env node

/**
 * Minimal Pre-Tool Hook for Claude Code
 * Simple validation and logging for Write/Edit/MultiEdit operations
 */

const process = require('process');

// Get tool and args from Claude Code environment
const tool = process.env.CLAUDE_TOOL_NAME || 'unknown';
const args = process.env.CLAUDE_TOOL_ARGS || '{}';

// Basic validation - ensure we're not writing to system directories
try {
  const toolArgs = JSON.parse(args);
  const filePath = toolArgs.file_path || toolArgs.notebook_path || '';
  
  // Block system directories
  const blockedPaths = ['/etc/', '/var/', '/usr/', '/sys/', '/proc/'];
  const isBlocked = blockedPaths.some(blocked => filePath.startsWith(blocked));
  
  if (isBlocked) {
    console.error(`❌ Blocked: Cannot write to system directory: ${filePath}`);
    process.exit(1);
  }
  
  // Log successful validation
  console.log(`✅ Pre-hook validation passed for ${tool} on ${filePath || 'unknown'}`);
  process.exit(0);
  
} catch (error) {
  // If we can't parse args, allow the operation but log the issue
  console.log(`⚠️  Pre-hook: Could not parse tool args, allowing operation`);
  process.exit(0);
}