#!/usr/bin/env node

/**
 * Test Genie AI Workflow Locally ✨
 * Simulates the GitHub Actions workflow for testing
 */

const { execSync } = require('child_process');
const fs = require('fs');

const testGenieWorkflow = async () => {
  console.log('🧞✨ Testing Genie AI Workflow Locally...\n');
  
  try {
    // Check if ANTHROPIC_API_KEY is available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY not found in environment');
      console.log('💡 Set it with: export ANTHROPIC_API_KEY="your-key"');
      process.exit(1);
    }
    
    console.log('✅ ANTHROPIC_API_KEY found');
    
    // Simulate getting release info
    console.log('\n📋 Simulating Release Info Generation...');
    
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = pkg.version;
    
    // Get git tags
    let tags = [];
    try {
      const tagOutput = execSync('git tag --sort=-version:refname', { encoding: 'utf8' });
      tags = tagOutput.trim().split('\n').filter(t => t.length > 0);
    } catch (error) {
      console.log('📝 No git tags found, using default range');
    }
    
    const prevTag = tags.find(tag => tag !== `v${currentVersion}`) || 'HEAD~10';
    const commitRange = `${prevTag}..HEAD`;
    
    console.log(`Current Version: v${currentVersion}`);
    console.log(`Previous Tag: ${prevTag}`);
    console.log(`Commit Range: ${commitRange}`);
    
    // Get commit log
    console.log('\n📝 Generating Commit Log...');
    let commitLog = '';
    try {
      commitLog = execSync(`git log --pretty=format:"- %s (%h)" ${commitRange}`, { encoding: 'utf8' });
    } catch (error) {
      console.log('⚠️  Could not get git commits, using sample data');
      commitLog = `- feat: enhance CLI with interactive statusline configuration
- feat: implement streamlined Genie version tracking system
- feat: add comprehensive test suite and cross-platform statusline templates`;
    }
    
    console.log('Commit Log:');
    console.log(commitLog);
    
    // Test Claude Code CLI (if available)
    console.log('\n🤖 Testing Claude Code Integration...');
    
    const prompt = `🧞✨ Greetings! You are GENIE - the magical AI development companion! 

I need you to work your magic and generate enchanting release notes for version v${currentVersion} of the automagik-genie project!

Here are the mystical code changes since the last release:
${commitLog}

Please cast your spell and format these release notes with magical flair:
1. ✨ **A brief enchanting summary** of what magic was woven in this release
2. 🆕 **New Features** (the new wishes granted!)
3. 🐛 **Bug Fixes** (the gremlins vanquished!)  
4. 🔧 **Improvements** (the magic enhanced!)
5. 📋 **Technical Details** (the arcane knowledge!)

Use beautiful markdown formatting with emojis and keep it professional yet magical - you're the charismatic Genie persona!

Remember: You're granting a wish for perfect release notes! Make it sparkle! ✨

Return ONLY the markdown-formatted release notes, no additional commentary.`;

    console.log('\n📤 Prompt for Genie:');
    console.log('---');
    console.log(prompt);
    console.log('---');
    
    // Check if Claude CLI is available (powering Genie)
    try {
      const claudeVersion = execSync('claude --version', { encoding: 'utf8' });
      console.log(`\n✅ Genie's magical powers found: ${claudeVersion.trim()}`);
      
      console.log('\n🧞✨ Summoning Genie with proper magical incantations...');
      
      // Use Claude CLI to power Genie with -p (non-interactive) and --output-format json
      const genieCommand = `claude -p "${prompt.replace(/"/g, '\\"')}" --output-format json`;
      
      console.log('Casting spell:', genieCommand.substring(0, 100) + '...');
      
      const jsonResponse = execSync(genieCommand, { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 // 1MB buffer for large responses
      });
      
      // Parse JSON response
      const response = JSON.parse(jsonResponse);
      
      console.log('\n🔮 Genie Response Metadata:');
      console.log(`- Magical Cost: $${response.total_cost_usd || 'N/A'}`);
      console.log(`- Spell Duration: ${response.duration_ms || 'N/A'}ms`);
      console.log(`- Magic Session ID: ${response.session_id || 'N/A'}`);
      console.log(`- Wish Turns: ${response.num_turns || 'N/A'}`);
      
      console.log('\n🧞✨ Generated Magical Release Notes:');
      console.log('='.repeat(50));
      console.log(response.result || response.response || 'No magical content received');
      console.log('='.repeat(50));
      
      // Save the release notes to a file for inspection
      const releaseNotes = response.result || response.response || '';
      fs.writeFileSync('genie-release-notes.md', releaseNotes);
      console.log('\n💾 Magical release notes saved to: genie-release-notes.md');
      
    } catch (error) {
      console.log('\n⚠️  Genie\'s magical powers not available locally');
      console.log('💡 The workflow will work in GitHub Actions with anthropics/claude-code-action powering Genie');
      console.log('\n📋 Genie Workflow Test Summary:');
      console.log('✅ Magical environment variables configured');
      console.log('✅ Git spell components extracted');
      console.log('✅ Genie prompt incantation generated successfully');
      console.log('⚠️  Genie integration requires GitHub Actions magical environment');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testGenieWorkflow();