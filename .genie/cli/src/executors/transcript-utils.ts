/**
 * Shared Transcript Utilities for Log Viewers
 *
 * Provides common functionality for parsing conversations, extracting metrics,
 * and slicing message arrays for both Codex and Claude executors.
 */

import { ChatMessage } from '../views/chat';
import { Tone } from '../view';

// ============================================================================
// Message Slicing Utilities
// ============================================================================

/**
 * Slice messages to show only the latest assistant message plus any
 * immediately preceding reasoning messages.
 *
 * Used for --live mode to show just the most recent output.
 *
 * @param messages - Full array of chat messages in temporal order
 * @returns Sliced array containing latest assistant + optional preceding reasoning
 */
export function sliceForLatest(messages: ChatMessage[]): ChatMessage[] {
  if (!messages.length) return [];

  // Find the last assistant message
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantIndex = i;
      break;
    }
  }

  // If no assistant message found, return empty
  if (lastAssistantIndex === -1) return [];

  // Find the start index by including preceding reasoning messages
  let startIndex = lastAssistantIndex;
  for (let i = lastAssistantIndex - 1; i >= 0; i--) {
    if (messages[i].role === 'reasoning') {
      startIndex = i;
    } else {
      // Stop at the first non-reasoning message
      break;
    }
  }

  return messages.slice(startIndex);
}

/**
 * Slice messages to show the last N messages (default 5).
 *
 * Used for default mode to show recent conversation context.
 * No filtering by message type - includes reasoning, tool, assistant, user, etc.
 *
 * @param messages - Full array of chat messages in temporal order
 * @param count - Number of messages to show (default: 5)
 * @returns Last N messages
 */
export function sliceForRecent(messages: ChatMessage[], count: number = 5): ChatMessage[] {
  if (!messages.length) return [];
  return messages.slice(-count);
}

// ============================================================================
// Metrics Extraction & Summarization
// ============================================================================

export interface MetricItem {
  label: string;
  value: string;
  tone?: Tone;
}

/**
 * Codex metrics extracted from JSONL events
 */
export interface CodexMetrics {
  tokens: { input: number; output: number; total: number } | null;
  mcpCalls: Array<{ server: string; tool: string; secs: number }>;
  patches: { add: number; update: number; move: number; delete: number };
  execs: Array<{ cmd: string; exit: number | null; dur?: { secs: number; nanos?: number } }>;
  rateLimits: { used_percent?: number; resets_in_seconds?: number } | null;
}

/**
 * Claude metrics extracted from JSONL events
 */
export interface ClaudeMetrics {
  tokens: { input: number; output: number; total: number } | null;
  toolCalls: Array<{ name: string; count: number }>;
  model: string | null;
}

/**
 * Summarize Codex metrics into header-friendly meta items.
 *
 * Format: concise single-line strings (<100 chars per value)
 *
 * @param metrics - Extracted Codex metrics
 * @returns Array of meta items for header display
 */
export function summarizeCodexMetrics(metrics: CodexMetrics): MetricItem[] {
  const items: MetricItem[] = [];

  // Tokens
  if (metrics.tokens) {
    const { input, output, total } = metrics.tokens;
    items.push({
      label: 'Tokens',
      value: `in:${input} out:${output} total:${total}`
    });
  }

  // MCP Calls (aggregate by server)
  if (metrics.mcpCalls.length > 0) {
    const serverCounts = new Map<string, number>();
    metrics.mcpCalls.forEach((call) => {
      const count = serverCounts.get(call.server) || 0;
      serverCounts.set(call.server, count + 1);
    });

    const sorted = Array.from(serverCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    const top2 = sorted.slice(0, 2);
    const remaining = sorted.length - 2;

    const summary = top2.map(([server, count]) => `${server}:${count}`).join(' ');
    const suffix = remaining > 0 ? ` +${remaining} more` : '';

    items.push({
      label: 'MCP Calls',
      value: `${metrics.mcpCalls.length} calls (${summary}${suffix})`
    });
  }

  // Patches
  const { add, update, move, delete: del } = metrics.patches;
  if (add || update || move || del) {
    items.push({
      label: 'Patches',
      value: `add:${add} update:${update} move:${move} delete:${del}`
    });
  }

  // Exec Commands
  if (metrics.execs.length > 0) {
    const okCount = metrics.execs.filter((e) => e.exit === 0).length;
    const errCount = metrics.execs.filter((e) => e.exit !== 0 && e.exit != null).length;
    items.push({
      label: 'Execs',
      value: `${metrics.execs.length} commands (${okCount} ok, ${errCount} err)`,
      tone: errCount > 0 ? 'warning' : undefined
    });
  }

  // Rate Limits
  if (metrics.rateLimits) {
    const percent = Math.round(metrics.rateLimits.used_percent || 0);
    const resetSec = Math.round(metrics.rateLimits.resets_in_seconds || 0);
    items.push({
      label: 'Rate Limit',
      value: `${percent}% used, resets in ${resetSec}s`,
      tone: percent > 80 ? 'warning' : undefined
    });
  }

  return items;
}

/**
 * Summarize Claude metrics into header-friendly meta items.
 *
 * Format: concise single-line strings (<100 chars per value)
 *
 * @param metrics - Extracted Claude metrics
 * @returns Array of meta items for header display
 */
export function summarizeClaudeMetrics(metrics: ClaudeMetrics): MetricItem[] {
  const items: MetricItem[] = [];

  // Tokens
  if (metrics.tokens) {
    const { input, output, total } = metrics.tokens;
    items.push({
      label: 'Tokens',
      value: `in:${input} out:${output} total:${total}`
    });
  }

  // Tool Calls
  if (metrics.toolCalls.length > 0) {
    const sorted = [...metrics.toolCalls].sort((a, b) => b.count - a.count);
    const top2 = sorted.slice(0, 2);
    const remaining = sorted.length - 2;

    const totalCalls = metrics.toolCalls.reduce((sum, tc) => sum + tc.count, 0);
    const summary = top2.map((tc) => `${tc.name}:${tc.count}`).join(' ');
    const suffix = remaining > 0 ? ` +${remaining} more` : '';

    items.push({
      label: 'Tool Calls',
      value: `${totalCalls} calls (${summary}${suffix})`
    });
  }

  // Model
  if (metrics.model) {
    items.push({
      label: 'Model',
      value: metrics.model
    });
  }

  return items;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Aggregate tool calls by name for Claude metrics
 */
export function aggregateToolCalls(toolCalls: Array<{ name: string }>): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();

  toolCalls.forEach((call) => {
    const count = counts.get(call.name) || 0;
    counts.set(call.name, count + 1);
  });

  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}