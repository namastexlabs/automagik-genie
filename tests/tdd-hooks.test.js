/**
 * Test suite for TDD hooks system
 * Validates that the TDD validator works correctly for different scenarios
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { TDDValidator } = require('../.claude/tdd_validator.js');

describe('TDD Hooks System', () => {
    let validator;
    
    beforeEach(() => {
        validator = new TDDValidator();
    });

    describe('File Type Classification', () => {
        test('should identify test files correctly', () => {
            expect(validator.isTestFile('tests/example.test.js')).toBe(true);
            expect(validator.isTestFile('src/utils.spec.js')).toBe(true);
            expect(validator.isTestFile('test_helper.js')).toBe(true);
            expect(validator.isTestFile('lib/main.js')).toBe(false);
        });

        test('should identify config files correctly', () => {
            expect(validator.isConfigFile('package.json')).toBe(true);
            expect(validator.isConfigFile('jest.config.js')).toBe(true);
            expect(validator.isConfigFile('.eslintrc.js')).toBe(true);
            expect(validator.isConfigFile('lib/main.js')).toBe(false);
        });

        test('should detect new functionality in code', () => {
            const codeWithFunction = 'function hello() { return "world"; }';
            const codeWithClass = 'class MyClass { constructor() {} }';
            const codeWithExport = 'module.exports = { hello: "world" };';
            const simpleCode = 'const x = 5;';

            expect(validator.hasNewFunctionality(codeWithFunction)).toBe(true);
            expect(validator.hasNewFunctionality(codeWithClass)).toBe(true);
            expect(validator.hasNewFunctionality(codeWithExport)).toBe(true);
            expect(validator.hasNewFunctionality(simpleCode)).toBe(false);
        });
    });

    describe('TDD Cycle Validation', () => {
        test('should allow test file creation', () => {
            const result = validator.validateTDDCycle(
                'Write',
                'tests/new-feature.test.js',
                'test("should work", () => { expect(true).toBe(true); });'
            );

            expect(result.allowed).toBe(true);
            expect(result.reason).toBe("Test file creation/modification allowed");
        });

        test('should allow config file changes', () => {
            const result = validator.validateTDDCycle(
                'Edit',
                'package.json',
                '{"name": "test-project"}'
            );

            expect(result.allowed).toBe(true);
            expect(result.reason).toBe("Configuration file - allowed");
        });

        test('should allow non-JS files', () => {
            const result = validator.validateTDDCycle(
                'Write',
                'README.md',
                '# My Project'
            );

            expect(result.allowed).toBe(true);
            expect(result.reason).toBe("Non-JavaScript file");
        });
    });

    describe('Test Discovery', () => {
        test('should find corresponding tests for existing test files', () => {
            // This test assumes our current test files exist
            expect(validator.findCorrespondingTests('tests/smoke.test.js')).toBe(true);
        });
    });

    describe('Hook Integration', () => {
        test('should handle MultiEdit tool correctly', async () => {
            const input = {
                tool: "MultiEdit",
                tool_input: {
                    file_path: "tests/example.test.js",
                    edits: [
                        { new_string: 'test("example", () => {});' },
                        { new_string: 'const helper = require("../lib/helper");' }
                    ]
                }
            };

            // Test that MultiEdit validation works
            const results = [];
            for (const edit of input.tool_input.edits) {
                const result = validator.validateTDDCycle(
                    input.tool,
                    input.tool_input.file_path,
                    edit.new_string
                );
                results.push(result);
            }

            expect(results.every(r => r.allowed)).toBe(true);
        });

        test('should handle Write tool correctly', () => {
            const input = {
                tool: "Write",
                tool_input: {
                    file_path: "tests/new-test.test.js",
                    content: 'describe("New feature", () => { test("should work", () => {}); });'
                }
            };

            const result = validator.validateTDDCycle(
                input.tool,
                input.tool_input.file_path,
                input.tool_input.content
            );

            expect(result.allowed).toBe(true);
        });

        test('should handle Edit tool correctly', () => {
            const input = {
                tool: "Edit",
                tool_input: {
                    file_path: "package.json",
                    new_string: '{"name": "updated-project"}'
                }
            };

            const result = validator.validateTDDCycle(
                input.tool,
                input.tool_input.file_path,
                input.tool_input.new_string
            );

            expect(result.allowed).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid input gracefully', () => {
            const result = validator.validateTDDCycle(
                'UnknownTool',
                '',
                ''
            );

            expect(result.allowed).toBe(true);
            expect(result.reason).toBe("Change approved");
        });
    });

    describe('Command Line Interface', () => {
        test('should be executable from command line', () => {
            // Test that the validator can be run standalone
            try {
                const result = execSync('node .claude/tdd_validator.js', {
                    cwd: path.join(__dirname, '..'),
                    encoding: 'utf8',
                    input: JSON.stringify({
                        tool: "Write",
                        tool_input: {
                            file_path: "tests/cli-test.test.js",
                            content: "test('cli test', () => {});"
                        }
                    })
                });

                const parsed = JSON.parse(result.trim());
                expect(parsed.status).toBe('allowed');
            } catch (error) {
                // If the command fails, it should still produce valid JSON
                const parsed = JSON.parse(error.stdout);
                expect(parsed).toHaveProperty('status');
            }
        });
    });
});