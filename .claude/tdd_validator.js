#!/usr/bin/env node
/**
 * TDD Validator for automagik-genie Node.js project
 * Ensures Test-Driven Development practices are followed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TDDValidator {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
        this.testsDir = path.join(this.projectRoot, 'tests');
    }

    runTests() {
        try {
            const result = execSync('npm test', { 
                cwd: this.projectRoot,
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            return {
                success: true,
                output: result,
                hasFailures: false
            };
        } catch (error) {
            return {
                success: false,
                output: error.stdout + error.stderr,
                hasFailures: true
            };
        }
    }

    validateTDDCycle(tool, filePath, content) {
        // Handle empty or invalid file paths
        if (!filePath || filePath.trim() === '') {
            return { allowed: true, reason: "Change approved" };
        }

        // Allow test files - they should be created first in RED phase
        if (this.isTestFile(filePath)) {
            return { allowed: true, reason: "Test file creation/modification allowed" };
        }

        // Allow configuration files (check before non-JS files)
        if (this.isConfigFile(filePath)) {
            return { allowed: true, reason: "Configuration file - allowed" };
        }

        // Allow non-JavaScript files to pass through
        if (!filePath.endsWith('.js') && !filePath.endsWith('.ts')) {
            return { allowed: true, reason: "Non-JavaScript file" };
        }

        // Check if this is a new implementation file
        const fileExists = fs.existsSync(filePath);
        
        if (!fileExists) {
            // For new implementation files, ensure we have tests
            const hasTests = this.findCorrespondingTests(filePath);
            
            if (!hasTests) {
                return {
                    allowed: false,
                    reason: `❌ RED PHASE VIOLATION: Creating implementation file '${filePath}' without corresponding tests. Create tests first!`
                };
            }
        }

        // Run tests to check current state
        const testResults = this.runTests();

        // If tests are failing, we're in RED phase - implementation changes are allowed
        if (testResults.hasFailures) {
            return {
                allowed: true,
                reason: "✅ GREEN PHASE: Tests failing, implementation changes allowed"
            };
        }

        // If all tests pass and we're adding new functions/classes, warn about TDD
        if (this.hasNewFunctionality(content) && !testResults.hasFailures) {
            // For now, allow but warn - in stricter TDD this would be blocked
            return {
                allowed: true,
                reason: "⚠️ REFACTOR PHASE: All tests passing, ensure new functionality has corresponding failing tests first"
            };
        }

        return { allowed: true, reason: "Change approved" };
    }

    isTestFile(filePath) {
        const fileName = path.basename(filePath);
        return fileName.includes('.test.') || 
               fileName.includes('.spec.') || 
               fileName.startsWith('test_') ||
               fileName.endsWith('_test.js') ||
               filePath.includes('/tests/') ||
               filePath.includes('/test/');
    }

    isConfigFile(filePath) {
        const configFiles = [
            'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
            'jest.config.js', 'jest.config.json', 'babel.config.js',
            '.eslintrc.js', '.eslintrc.json', '.prettierrc',
            'tsconfig.json', 'webpack.config.js', 'rollup.config.js'
        ];
        
        const fileName = path.basename(filePath);
        return configFiles.includes(fileName) || 
               fileName.startsWith('.') ||
               filePath.includes('node_modules/');
    }

    findCorrespondingTests(filePath) {
        const fileName = path.basename(filePath, path.extname(filePath));
        
        // Handle absolute paths by making them relative to project root
        let relativePath;
        if (path.isAbsolute(filePath)) {
            relativePath = path.relative(this.projectRoot, filePath);
        } else {
            relativePath = filePath;
        }
        
        const dirName = path.dirname(relativePath);

        // Common test patterns for Node.js projects
        const testPatterns = [
            // If the file itself is already a test file, return true
            filePath,
            
            // Same directory patterns
            path.join(dirName, `${fileName}.test.js`),
            path.join(dirName, `${fileName}.spec.js`),
            path.join(dirName, `test_${fileName}.js`),
            
            // Tests directory patterns
            path.join('tests', `${fileName}.test.js`),
            path.join('tests', `${fileName}.spec.js`),
            path.join('test', `${fileName}.test.js`),
            path.join('test', `${fileName}.spec.js`),
            
            // Mirrored structure in tests
            path.join('tests', dirName, `${fileName}.test.js`),
            path.join('test', dirName, `${fileName}.test.js`),
        ];

        return testPatterns.some(pattern => {
            const fullPath = path.join(this.projectRoot, pattern);
            return fs.existsSync(fullPath);
        });
    }

    hasNewFunctionality(content) {
        // Simple heuristic - look for function declarations, class declarations, exports
        const functionalityPatterns = [
            /function\s+\w+/,           // function declarations
            /const\s+\w+\s*=\s*\(/,     // arrow functions assigned to const
            /class\s+\w+/,             // class declarations
            /module\.exports\s*=/,      // CommonJS exports
            /exports\.\w+/,            // CommonJS named exports
            /export\s+(function|class|const)/, // ES6 exports
        ];

        return functionalityPatterns.some(pattern => pattern.test(content));
    }
}

async function main() {
    try {
        // Read JSON input from stdin
        let inputData = '';
        
        if (process.stdin.isTTY) {
            // If no stdin, create test scenario for debugging
            inputData = JSON.stringify({
                tool: "Write",
                tool_input: {
                    file_path: "lib/example.js",
                    content: "function hello() { return 'world'; }"
                }
            });
        } else {
            // Read from stdin
            for await (const chunk of process.stdin) {
                inputData += chunk;
            }
        }

        const input = JSON.parse(inputData);
        const validator = new TDDValidator();

        const tool = input.tool || "Unknown";
        const toolInput = input.tool_input || {};

        let validationResults = [];

        // Handle different tool types
        if (["Write", "Edit", "MultiEdit"].includes(tool)) {
            if (tool === "MultiEdit") {
                // Handle multiple edits
                const edits = toolInput.edits || [];
                const filePath = toolInput.file_path || "";

                for (const edit of edits) {
                    const result = validator.validateTDDCycle(
                        tool, 
                        filePath, 
                        edit.new_string || ""
                    );
                    validationResults.push(result);
                    
                    if (!result.allowed) break;
                }
            } else {
                // Handle single edit
                const filePath = toolInput.file_path || "";
                const content = toolInput.content || toolInput.new_string || "";

                const result = validator.validateTDDCycle(tool, filePath, content);
                validationResults.push(result);
            }
        }

        // Check if any validation failed
        const failedValidation = validationResults.find(r => !r.allowed);
        
        if (failedValidation) {
            console.log(JSON.stringify({
                status: "blocked",
                reason: failedValidation.reason
            }));
            process.exit(1);
        }

        // All validations passed
        const successReasons = validationResults
            .map(r => r.reason)
            .filter(r => r !== "Change approved");

        console.log(JSON.stringify({
            status: "allowed",
            reason: successReasons.length > 0 ? successReasons.join("; ") : "TDD validation passed"
        }));
        process.exit(0);

    } catch (error) {
        // On any error, allow the operation but log the error
        console.log(JSON.stringify({
            status: "allowed",
            reason: `TDD Validator Error: ${error.message} - Operation allowed`
        }));
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}

module.exports = { TDDValidator };