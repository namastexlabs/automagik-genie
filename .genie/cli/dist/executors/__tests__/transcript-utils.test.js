"use strict";
/**
 * Unit tests for transcript utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const transcript_utils_1 = require("../transcript-utils");
describe('Message Slicing Utilities', () => {
    describe('sliceForLatest', () => {
        it('should return empty array for empty input', () => {
            expect((0, transcript_utils_1.sliceForLatest)([])).toEqual([]);
        });
        it('should return only the latest assistant message when no reasoning precedes it', () => {
            const messages = [
                { role: 'assistant', title: 'Message 1', body: ['First'] },
                { role: 'tool', title: 'Tool 1', body: ['Tool call'] },
                { role: 'assistant', title: 'Message 2', body: ['Second'] }
            ];
            const result = (0, transcript_utils_1.sliceForLatest)(messages);
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Message 2');
        });
        it('should include preceding reasoning messages', () => {
            const messages = [
                { role: 'assistant', title: 'Message 1', body: ['First'] },
                { role: 'reasoning', title: 'Thinking 1', body: ['Reasoning 1'] },
                { role: 'reasoning', title: 'Thinking 2', body: ['Reasoning 2'] },
                { role: 'assistant', title: 'Message 2', body: ['Second'] }
            ];
            const result = (0, transcript_utils_1.sliceForLatest)(messages);
            expect(result).toHaveLength(3);
            expect(result[0].title).toBe('Thinking 1');
            expect(result[1].title).toBe('Thinking 2');
            expect(result[2].title).toBe('Message 2');
        });
        it('should stop at non-reasoning messages when looking backwards', () => {
            const messages = [
                { role: 'assistant', title: 'Message 1', body: ['First'] },
                { role: 'tool', title: 'Tool 1', body: ['Tool call'] },
                { role: 'reasoning', title: 'Thinking 1', body: ['Reasoning 1'] },
                { role: 'assistant', title: 'Message 2', body: ['Second'] }
            ];
            const result = (0, transcript_utils_1.sliceForLatest)(messages);
            expect(result).toHaveLength(2);
            expect(result[0].title).toBe('Thinking 1');
            expect(result[1].title).toBe('Message 2');
        });
        it('should return empty array if no assistant messages exist', () => {
            const messages = [
                { role: 'reasoning', title: 'Thinking 1', body: ['Reasoning'] },
                { role: 'tool', title: 'Tool 1', body: ['Tool call'] }
            ];
            const result = (0, transcript_utils_1.sliceForLatest)(messages);
            expect(result).toEqual([]);
        });
    });
    describe('sliceForRecent', () => {
        it('should return empty array for empty input', () => {
            expect((0, transcript_utils_1.sliceForRecent)([])).toEqual([]);
        });
        it('should return last 5 messages by default', () => {
            const messages = Array.from({ length: 10 }, (_, i) => ({
                role: 'assistant',
                title: `Message ${i + 1}`,
                body: [`Body ${i + 1}`]
            }));
            const result = (0, transcript_utils_1.sliceForRecent)(messages);
            expect(result).toHaveLength(5);
            expect(result[0].title).toBe('Message 6');
            expect(result[4].title).toBe('Message 10');
        });
        it('should return all messages if fewer than 5 exist', () => {
            const messages = [
                { role: 'assistant', title: 'Message 1', body: ['First'] },
                { role: 'tool', title: 'Tool 1', body: ['Tool'] },
                { role: 'assistant', title: 'Message 2', body: ['Second'] }
            ];
            const result = (0, transcript_utils_1.sliceForRecent)(messages);
            expect(result).toHaveLength(3);
        });
        it('should respect custom count parameter', () => {
            const messages = Array.from({ length: 10 }, (_, i) => ({
                role: 'assistant',
                title: `Message ${i + 1}`,
                body: [`Body ${i + 1}`]
            }));
            const result = (0, transcript_utils_1.sliceForRecent)(messages, 3);
            expect(result).toHaveLength(3);
            expect(result[0].title).toBe('Message 8');
            expect(result[2].title).toBe('Message 10');
        });
        it('should include all message types (no filtering)', () => {
            const messages = [
                { role: 'action', title: 'Action 1', body: ['User action'] },
                { role: 'reasoning', title: 'Thinking 1', body: ['Reasoning'] },
                { role: 'tool', title: 'Tool 1', body: ['Tool call'] },
                { role: 'assistant', title: 'Message 1', body: ['Assistant'] }
            ];
            const result = (0, transcript_utils_1.sliceForRecent)(messages, 3);
            expect(result).toHaveLength(3);
            expect(result.map((m) => m.role)).toEqual(['reasoning', 'tool', 'assistant']);
        });
    });
});
describe('Metrics Summarization', () => {
    describe('summarizeCodexMetrics', () => {
        it('should format tokens correctly', () => {
            const metrics = {
                tokens: { input: 1234, output: 567, total: 1801 },
                mcpCalls: [],
                patches: { add: 0, update: 0, move: 0, delete: 0 },
                execs: [],
                rateLimits: null
            };
            const result = (0, transcript_utils_1.summarizeCodexMetrics)(metrics);
            expect(result).toContainEqual({
                label: 'Tokens',
                value: 'in:1234 out:567 total:1801'
            });
        });
        it('should aggregate MCP calls by server and show top 2', () => {
            const metrics = {
                tokens: null,
                mcpCalls: [
                    { server: 'forge', tool: 'create', secs: 1 },
                    { server: 'forge', tool: 'list', secs: 0.5 },
                    { server: 'forge', tool: 'update', secs: 0.8 },
                    { server: 'gh', tool: 'pr', secs: 2 },
                    { server: 'gh', tool: 'issue', secs: 1.5 },
                    { server: 'slack', tool: 'send', secs: 0.3 }
                ],
                patches: { add: 0, update: 0, move: 0, delete: 0 },
                execs: [],
                rateLimits: null
            };
            const result = (0, transcript_utils_1.summarizeCodexMetrics)(metrics);
            const mcpItem = result.find((item) => item.label === 'MCP Calls');
            expect(mcpItem).toBeDefined();
            expect(mcpItem?.value).toBe('6 calls (forge:3 gh:2 +1 more)');
        });
        it('should format patches correctly', () => {
            const metrics = {
                tokens: null,
                mcpCalls: [],
                patches: { add: 2, update: 3, move: 0, delete: 1 },
                execs: [],
                rateLimits: null
            };
            const result = (0, transcript_utils_1.summarizeCodexMetrics)(metrics);
            expect(result).toContainEqual({
                label: 'Patches',
                value: 'add:2 update:3 move:0 delete:1'
            });
        });
        it('should summarize exec commands with ok/err counts', () => {
            const metrics = {
                tokens: null,
                mcpCalls: [],
                patches: { add: 0, update: 0, move: 0, delete: 0 },
                execs: [
                    { cmd: 'ls', exit: 0 },
                    { cmd: 'pwd', exit: 0 },
                    { cmd: 'cat missing.txt', exit: 1 },
                    { cmd: 'echo test', exit: 0 }
                ],
                rateLimits: null
            };
            const result = (0, transcript_utils_1.summarizeCodexMetrics)(metrics);
            const execItem = result.find((item) => item.label === 'Execs');
            expect(execItem).toBeDefined();
            expect(execItem?.value).toBe('4 commands (3 ok, 1 err)');
            expect(execItem?.tone).toBe('warning');
        });
        it('should format rate limits with warning tone when >80%', () => {
            const metrics = {
                tokens: null,
                mcpCalls: [],
                patches: { add: 0, update: 0, move: 0, delete: 0 },
                execs: [],
                rateLimits: { used_percent: 85, resets_in_seconds: 120 }
            };
            const result = (0, transcript_utils_1.summarizeCodexMetrics)(metrics);
            expect(result).toContainEqual({
                label: 'Rate Limit',
                value: '85% used, resets in 120s',
                tone: 'warning'
            });
        });
        it('should not show warning tone for rate limits <=80%', () => {
            const metrics = {
                tokens: null,
                mcpCalls: [],
                patches: { add: 0, update: 0, move: 0, delete: 0 },
                execs: [],
                rateLimits: { used_percent: 45, resets_in_seconds: 120 }
            };
            const result = (0, transcript_utils_1.summarizeCodexMetrics)(metrics);
            const rateLimitItem = result.find((item) => item.label === 'Rate Limit');
            expect(rateLimitItem?.tone).toBeUndefined();
        });
        it('should handle empty metrics gracefully', () => {
            const metrics = {
                tokens: null,
                mcpCalls: [],
                patches: { add: 0, update: 0, move: 0, delete: 0 },
                execs: [],
                rateLimits: null
            };
            const result = (0, transcript_utils_1.summarizeCodexMetrics)(metrics);
            expect(result).toEqual([]);
        });
    });
    describe('summarizeClaudeMetrics', () => {
        it('should format tokens correctly', () => {
            const metrics = {
                tokens: { input: 890, output: 234, total: 1124 },
                toolCalls: [],
                model: null
            };
            const result = (0, transcript_utils_1.summarizeClaudeMetrics)(metrics);
            expect(result).toContainEqual({
                label: 'Tokens',
                value: 'in:890 out:234 total:1124'
            });
        });
        it('should aggregate tool calls and show top 2', () => {
            const metrics = {
                tokens: null,
                toolCalls: [
                    { name: 'Read', count: 5 },
                    { name: 'Bash', count: 3 },
                    { name: 'Edit', count: 2 }
                ],
                model: null
            };
            const result = (0, transcript_utils_1.summarizeClaudeMetrics)(metrics);
            const toolItem = result.find((item) => item.label === 'Tool Calls');
            expect(toolItem).toBeDefined();
            expect(toolItem?.value).toBe('10 calls (Read:5 Bash:3 +1 more)');
        });
        it('should include model information', () => {
            const metrics = {
                tokens: null,
                toolCalls: [],
                model: 'claude-sonnet-4'
            };
            const result = (0, transcript_utils_1.summarizeClaudeMetrics)(metrics);
            expect(result).toContainEqual({
                label: 'Model',
                value: 'claude-sonnet-4'
            });
        });
        it('should handle empty metrics gracefully', () => {
            const metrics = {
                tokens: null,
                toolCalls: [],
                model: null
            };
            const result = (0, transcript_utils_1.summarizeClaudeMetrics)(metrics);
            expect(result).toEqual([]);
        });
    });
    describe('aggregateToolCalls', () => {
        it('should count tool calls by name', () => {
            const toolCalls = [
                { name: 'Read' },
                { name: 'Bash' },
                { name: 'Read' },
                { name: 'Edit' },
                { name: 'Read' },
                { name: 'Bash' }
            ];
            const result = (0, transcript_utils_1.aggregateToolCalls)(toolCalls);
            expect(result).toHaveLength(3);
            const readCount = result.find((tc) => tc.name === 'Read');
            expect(readCount?.count).toBe(3);
            const bashCount = result.find((tc) => tc.name === 'Bash');
            expect(bashCount?.count).toBe(2);
            const editCount = result.find((tc) => tc.name === 'Edit');
            expect(editCount?.count).toBe(1);
        });
        it('should handle empty array', () => {
            const result = (0, transcript_utils_1.aggregateToolCalls)([]);
            expect(result).toEqual([]);
        });
        it('should handle single tool call', () => {
            const toolCalls = [{ name: 'Read' }];
            const result = (0, transcript_utils_1.aggregateToolCalls)(toolCalls);
            expect(result).toEqual([{ name: 'Read', count: 1 }]);
        });
    });
});
