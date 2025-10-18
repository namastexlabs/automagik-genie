#!/usr/bin/env node
/**
 * Validate Role
 *
 * Pre-MCP delegation validator ensuring requests match neuron capabilities.
 * Prevents misrouting and ensures proper neuron selection.
 *
 * Usage: node validate-role.js <neuron-name> <request-description>
 *
 * Validates:
 * - Neuron exists and is available
 * - Request matches neuron's documented capabilities
 * - No better neuron for the task
 * - Prerequisites met
 *
 * Example:
 *   node validate-role.js git "Create GitHub release"
 *   node validate-role.js implementor "Write routing documentation"
 */

const fs = require('fs');
const path = require('path');

// Neuron capabilities map (simplified - should load from agent configs)
const NEURON_CAPABILITIES = {
  git: {
    capabilities: ['git operations', 'github issues', 'pull requests', 'releases', 'branch management'],
    keywords: ['git', 'github', 'pr', 'issue', 'branch', 'commit', 'release', 'merge'],
  },
  implementor: {
    capabilities: ['code implementation', 'feature development', 'refactoring', 'bug fixes'],
    keywords: ['implement', 'code', 'feature', 'refactor', 'fix', 'develop', 'write code'],
  },
  tests: {
    capabilities: ['test creation', 'test execution', 'qa validation', 'coverage analysis'],
    keywords: ['test', 'testing', 'qa', 'validation', 'coverage', 'spec'],
  },
  prompt: {
    capabilities: ['instruction writing', 'prompt crafting', 'agent configuration', 'skill documentation'],
    keywords: ['prompt', 'instruction', 'write prompt', 'agent config', 'skill'],
  },
  genie: {
    capabilities: ['strategic planning', 'analysis', 'debugging', 'architecture decisions'],
    keywords: ['plan', 'analyze', 'debug', 'strategy', 'architecture', 'design'],
  },
  learn: {
    capabilities: ['pattern documentation', 'lesson capture', 'skill creation', 'knowledge synthesis'],
    keywords: ['learn', 'document', 'lesson', 'pattern', 'knowledge', 'synthesize'],
  },
  release: {
    capabilities: ['release management', 'changelog generation', 'versioning', 'publishing'],
    keywords: ['release', 'publish', 'version', 'changelog', 'deploy'],
  },
};

function validateRole(neuronName, requestDescription) {
  console.log(`🔍 Validating delegation: ${neuronName} for "${requestDescription}"\n`);

  // Check neuron exists
  const neuron = NEURON_CAPABILITIES[neuronName];
  if (!neuron) {
    console.error(`❌ INVALID: Neuron "${neuronName}" does not exist`);
    console.log(`\n💡 Available neurons: ${Object.keys(NEURON_CAPABILITIES).join(', ')}`);
    return false;
  }

  // Check request matches capabilities
  const requestLower = requestDescription.toLowerCase();
  const matchedKeywords = neuron.keywords.filter(keyword =>
    requestLower.includes(keyword)
  );

  if (matchedKeywords.length === 0) {
    console.warn(`⚠️  WARNING: Request may not match neuron capabilities`);
    console.log(`\n${neuronName} capabilities:`);
    neuron.capabilities.forEach(cap => console.log(`  - ${cap}`));
    console.log(`\nRequest: ${requestDescription}`);
    console.log(`\n💡 Consider: ${suggestBetterNeuron(requestDescription)}`);
    return false;
  }

  console.log(`✅ VALID delegation to ${neuronName}`);
  console.log(`   Matched keywords: ${matchedKeywords.join(', ')}`);
  console.log(`   Capabilities: ${neuron.capabilities.join(', ')}`);
  return true;
}

function suggestBetterNeuron(requestDescription) {
  const requestLower = requestDescription.toLowerCase();
  const suggestions = [];

  for (const [name, neuron] of Object.entries(NEURON_CAPABILITIES)) {
    const matches = neuron.keywords.filter(kw => requestLower.includes(kw)).length;
    if (matches > 0) {
      suggestions.push({ name, matches });
    }
  }

  suggestions.sort((a, b) => b.matches - a.matches);

  if (suggestions.length === 0) {
    return 'Handle in main conversation (no neuron match)';
  }

  return suggestions.slice(0, 3).map(s => s.name).join(' or ');
}

// CLI execution
if (require.main === module) {
  const neuronName = process.argv[2];
  const requestDescription = process.argv.slice(3).join(' ');

  if (!neuronName || !requestDescription) {
    console.error('Usage: node validate-role.js <neuron-name> <request-description>');
    console.error('\nExample:');
    console.error('  node validate-role.js git "Create GitHub release"');
    console.error('  node validate-role.js implementor "Write documentation"');
    console.error(`\nAvailable neurons: ${Object.keys(NEURON_CAPABILITIES).join(', ')}`);
    process.exit(1);
  }

  const isValid = validateRole(neuronName, requestDescription);
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateRole };
