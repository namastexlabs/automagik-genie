#!/usr/bin/env node

/**
 * Token Efficiency Analyzer
 *
 * Analyzes .genie knowledge base for:
 * 1. Token distribution per skill
 * 2. Redundant content patterns
 * 3. Dependency relationships
 * 4. Lazy-load optimization opportunities
 */

const fs = require('fs');
const path = require('path');

// Simple token estimator (chars/4 approximation)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Extract @ references from markdown
function extractReferences(content) {
  const refPattern = /@([^\s]+\.md)/g;
  const matches = [...content.matchAll(refPattern)];
  return matches.map(m => m[1]);
}

// Analyze a single skill file
function analyzeSkill(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tokens = estimateTokens(content);
  const refs = extractReferences(content);
  const lines = content.split('\n').length;

  // Look for redundancy patterns
  const hasRules = /##?\s*Rules?:/i.test(content);
  const hasProcess = /##?\s*Process:/i.test(content);
  const hasExample = /##?\s*Examples?:/i.test(content);
  const hasWhen = /##?\s*When to/i.test(content);
  const hasNever = /##?\s*Never/i.test(content);

  return {
    path: filePath,
    tokens,
    lines,
    refs,
    patterns: {
      hasRules,
      hasProcess,
      hasExample,
      hasWhen,
      hasNever
    }
  };
}

// Scan directory recursively
function scanDirectory(dir, baseDir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const relativePath = path.relative(baseDir, fullPath);
      results.push(analyzeSkill(fullPath));
    }
  }

  return results;
}

// Categorize skills
function categorizeSkills(skills) {
  const categories = {
    mandatory: [],
    onDemand: [],
    workflows: [],
    teams: [],
    product: []
  };

  for (const skill of skills) {
    const p = skill.path;

    if (p.includes('/skills/know-yourself') ||
        p.includes('/skills/investigate-before') ||
        p.includes('/skills/routing-decision') ||
        p.includes('/skills/delegate-dont') ||
        p.includes('/skills/orchestrator-not')) {
      categories.mandatory.push(skill);
    } else if (p.includes('/workflows/')) {
      categories.workflows.push(skill);
    } else if (p.includes('/teams/')) {
      categories.teams.push(skill);
    } else if (p.includes('/product/')) {
      categories.product.push(skill);
    } else if (p.includes('/skills/')) {
      categories.onDemand.push(skill);
    }
  }

  return categories;
}

// Main analysis
function main() {
  const baseDir = path.resolve(__dirname, '../..');
  const genieDir = path.join(baseDir, '.genie');

  console.log('🔍 Analyzing Genie knowledge base for token efficiency...\n');

  const skills = scanDirectory(genieDir, baseDir);
  const categories = categorizeSkills(skills);

  // Calculate totals
  const totals = {
    mandatory: categories.mandatory.reduce((sum, s) => sum + s.tokens, 0),
    onDemand: categories.onDemand.reduce((sum, s) => sum + s.tokens, 0),
    workflows: categories.workflows.reduce((sum, s) => sum + s.tokens, 0),
    teams: categories.teams.reduce((sum, s) => sum + s.tokens, 0),
    product: categories.product.reduce((sum, s) => sum + s.tokens, 0)
  };

  const grandTotal = Object.values(totals).reduce((sum, t) => sum + t, 0);

  console.log('📊 TOKEN DISTRIBUTION\n');
  console.log(`Total tokens: ${grandTotal.toLocaleString()}\n`);

  for (const [cat, total] of Object.entries(totals)) {
    const pct = ((total / grandTotal) * 100).toFixed(1);
    console.log(`${cat.padEnd(15)} ${total.toLocaleString().padStart(7)} (${pct}%)`);
  }

  console.log('\n📋 TOP 10 LARGEST FILES\n');
  const sorted = [...skills].sort((a, b) => b.tokens - a.tokens).slice(0, 10);
  for (const skill of sorted) {
    const relPath = path.relative(baseDir, skill.path);
    console.log(`${skill.tokens.toString().padStart(5)} tokens - ${relPath}`);
  }

  console.log('\n🔗 REFERENCE DENSITY (files with most @refs)\n');
  const byRefs = [...skills].sort((a, b) => b.refs.length - a.refs.length).slice(0, 10);
  for (const skill of byRefs) {
    if (skill.refs.length > 0) {
      const relPath = path.relative(baseDir, skill.path);
      console.log(`${skill.refs.length.toString().padStart(2)} refs - ${relPath}`);
    }
  }

  console.log('\n🎯 LAZY-LOAD OPPORTUNITIES\n');

  // Calculate baseline if we only load mandatory skills
  console.log(`Current baseline (all): ${grandTotal.toLocaleString()} tokens`);
  console.log(`Minimal baseline (mandatory only): ${totals.mandatory.toLocaleString()} tokens`);
  console.log(`Potential savings: ${(grandTotal - totals.mandatory).toLocaleString()} tokens (${(((grandTotal - totals.mandatory) / grandTotal) * 100).toFixed(1)}%)\n`);

  console.log('Mandatory skills (always loaded):');
  for (const skill of categories.mandatory) {
    const relPath = path.relative(baseDir, skill.path);
    console.log(`  - ${relPath} (${skill.tokens} tokens)`);
  }

  console.log('\n💡 OPTIMIZATION RECOMMENDATIONS\n');

  console.log('1. LAZY-LOAD ENTRY POINT:');
  console.log('   - Load only mandatory skills at startup (~' + totals.mandatory + ' tokens)');
  console.log('   - Use MCP resources/prompts to load on-demand skills');
  console.log('   - Detect context triggers to auto-load relevant skills\n');

  console.log('2. REDUNDANCY REDUCTION:');
  const patternsCount = skills.reduce((sum, s) => {
    return sum + Object.values(s.patterns).filter(v => v).length;
  }, 0);
  console.log(`   - ${patternsCount} section patterns detected across ${skills.length} files`);
  console.log('   - Standardize section headers for easier extraction');
  console.log('   - Extract common patterns to shared templates\n');

  console.log('3. ATOMIC SKILL UNITS:');
  const avgTokens = Math.floor(grandTotal / skills.length);
  const oversized = skills.filter(s => s.tokens > avgTokens * 2);
  console.log(`   - Average skill size: ${avgTokens} tokens`);
  console.log(`   - ${oversized.length} oversized skills (>2x average):`);
  for (const skill of oversized.slice(0, 5)) {
    const relPath = path.relative(baseDir, skill.path);
    console.log(`     • ${relPath} (${skill.tokens} tokens)`);
  }

  // Generate JSON output for programmatic use
  const outputPath = path.join(genieDir, 'reports', 'token-efficiency-analysis.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totals,
    grandTotal,
    categories,
    skills: skills.map(s => ({
      path: path.relative(baseDir, s.path),
      tokens: s.tokens,
      lines: s.lines,
      refs: s.refs,
      patterns: s.patterns
    }))
  }, null, 2));

  console.log(`\n✅ Detailed analysis saved to: ${path.relative(baseDir, outputPath)}\n`);
}

main();
