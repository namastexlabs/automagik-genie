#!/usr/bin/env node

/**
 * Test MCP prompts programmatically
 * Generates sample outputs for verification
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, '../../../mcp/dist/server.js');

// Test prompts with sample arguments
const testCases = [
  {
    name: 'plan',
    arguments: {
      idea: 'Add authentication to the API',
      context: 'We need JWT-based auth with refresh tokens'
    }
  },
  {
    name: 'twin',
    arguments: {
      situation: 'Deciding between PostgreSQL and MongoDB for user data',
      goal: 'Evaluate database choice for scalability and maintainability',
      mode_hint: 'decision'
    }
  },
  {
    name: 'prompt',
    arguments: {
      task_description: 'Fix bug where login fails after password reset',
      current_prompt: 'Debug the login issue'
    }
  }
];

async function testPrompt(promptName, args) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath]);
    let output = '';
    let errorOutput = '';

    // Initialize protocol
    const initMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' }
      }
    };

    // Get prompt
    const getPromptMsg = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/get',
      params: {
        name: promptName,
        arguments: args
      }
    };

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Server exited with code ${code}\nStderr: ${errorOutput}`));
      } else {
        resolve(output);
      }
    });

    // Send messages
    server.stdin.write(JSON.stringify(initMsg) + '\n');

    // Wait a bit for initialization
    setTimeout(() => {
      server.stdin.write(JSON.stringify(getPromptMsg) + '\n');
      server.stdin.end();
    }, 100);
  });
}

async function runTests() {
  console.log('Testing MCP prompts...\n');

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing prompt: ${testCase.name}`);
    console.log(`Arguments: ${JSON.stringify(testCase.arguments, null, 2)}`);
    console.log('='.repeat(80));

    try {
      const output = await testPrompt(testCase.name, testCase.arguments);

      // Parse JSON-RPC responses
      const responses = output.trim().split('\n').filter(line => line.trim());

      for (const response of responses) {
        try {
          const parsed = JSON.parse(response);

          if (parsed.result?.messages) {
            console.log('\n📝 Prompt Output:');
            console.log('-'.repeat(80));
            parsed.result.messages.forEach(msg => {
              if (msg.content?.text) {
                console.log(msg.content.text);
              }
            });
            console.log('-'.repeat(80));
          }
        } catch (e) {
          // Not JSON, skip
        }
      }

      console.log(`\n✅ ${testCase.name} prompt tested successfully`);

    } catch (error) {
      console.error(`\n❌ Error testing ${testCase.name}:`, error.message);
    }
  }

  console.log('\n\nTest complete!');
}

runTests().catch(console.error);
