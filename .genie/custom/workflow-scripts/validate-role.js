#!/usr/bin/env node

/**
 * validate-role.js
 *
 * Purpose: Pre-MCP delegation validator
 * Implements: role-clarity-protocol.md validation checks
 *
 * Validates:
 * - Orchestrator vs Implementor role clarity
 * - Session state checks before delegation
 * - Prevents bypassing active sessions
 *
 * Usage: node validate-role.js <current-role> <intended-action> [session-state-path]
 * Output: JSON { valid: boolean, error?: string, suggestion?: string }
 */

const fs = require('fs');
const path = require('path');

const ORCHESTRATOR_ACTIONS = [
  'delegate',
  'route',
  'coordinate',
  'track',
  'resume_session',
];

const IMPLEMENTOR_ACTIONS = [
  'edit',
  'write',
  'implement',
  'execute',
  'create_file',
];

function validateRole(currentRole, intendedAction, sessionStatePath) {
  const result = {
    valid: false,
    role: currentRole,
    action: intendedAction,
  };

  // Normalize inputs
  const role = currentRole.toLowerCase();
  const action = intendedAction.toLowerCase();

  // Check for orchestrator attempting implementor actions
  if (role === 'orchestrator' || role === 'genie' || role === 'coordinator') {
    // Allow orchestrator delegation actions explicitly
    if (ORCHESTRATOR_ACTIONS.some((a) => action.includes(a))) {
      result.valid = true;
      result.message = 'Orchestrator delegation action validated';
      return result;
    }

    // Check for implementor actions
    if (IMPLEMENTOR_ACTIONS.some((a) => action.includes(a))) {
      // Check if there's an active session that should handle this
      if (sessionStatePath && fs.existsSync(sessionStatePath)) {
        const sessionState = fs.readFileSync(sessionStatePath, 'utf8');

        // Simple check for active implementor session
        if (sessionState.includes('implementor') && sessionState.includes('active')) {
          result.valid = false;
          result.error = 'Active implementor session exists - delegate instead of executing';
          result.suggestion = 'Use mcp__genie__resume or check session with mcp__genie__view';
          return result;
        }
      }

      // No active session - check if user explicitly said "execute directly"
      result.valid = false;
      result.error = 'Orchestrator attempting implementation action';
      result.suggestion = 'Delegate to implementor neuron unless user explicitly says "execute directly"';
      return result;
    }
  }

  // Check for implementor attempting delegation
  if (role === 'implementor' || role === 'specialist') {
    if (ORCHESTRATOR_ACTIONS.some((a) => action.includes(a))) {
      result.valid = false;
      result.error = 'Implementor attempting orchestration action';
      result.suggestion = 'Specialists execute directly - no delegation';
      return result;
    }
  }

  // Validation passed
  result.valid = true;
  result.message = 'Role and action alignment validated';
  return result;
}

// CLI interface
if (require.main === module) {
  const [, , currentRole, intendedAction, sessionStatePath] = process.argv;

  if (!currentRole || !intendedAction) {
    console.error('Usage: node validate-role.js <current-role> <intended-action> [session-state-path]');
    console.error('Example: node validate-role.js orchestrator "edit file" .genie/SESSION-STATE.md');
    process.exit(1);
  }

  try {
    const result = validateRole(currentRole, intendedAction, sessionStatePath);
    console.log(JSON.stringify(result, null, 2));

    // Exit with code 0 if valid, 1 if not
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { validateRole };
