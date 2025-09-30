import path from 'path';
import type { ConfigPaths } from './types';
import {
  INTERNAL_START_TIME_ENV,
  INTERNAL_LOG_PATH_ENV
} from '../background-manager';

export function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'n/a';
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(value).toLocaleDateString();
}

export function formatPathRelative(targetPath: string, baseDir: string): string {
  if (!targetPath) return 'n/a';
  try {
    return path.relative(baseDir, targetPath) || targetPath;
  } catch {
    return targetPath;
  }
}

export function truncateText(text: string, maxLength = 64): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  const sliceLength = Math.max(0, maxLength - 3);
  return text.slice(0, sliceLength).trimEnd() + '...';
}

export function sanitizeLogFilename(agentName: string): string {
  const fallback = 'agent';
  if (!agentName || typeof agentName !== 'string') return fallback;
  const normalized = agentName
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/\.+/g, '.')
    .replace(/^-+|-+$/g, '')
    .replace(/^\.+|\.+$/g, '');
  return normalized.length ? normalized : fallback;
}

export function safeIsoString(value: string): string | null {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

export function deriveStartTime(): number {
  const fromEnv = process.env[INTERNAL_START_TIME_ENV];
  if (!fromEnv) return Date.now();
  const parsed = Number(fromEnv);
  if (Number.isFinite(parsed)) return parsed;
  return Date.now();
}

export function deriveLogFile(agentName: string, startTime: number, paths: Required<ConfigPaths>): string {
  const envPath = process.env[INTERNAL_LOG_PATH_ENV];
  if (envPath) return envPath;
  const filename = `${sanitizeLogFilename(agentName)}-${startTime}.log`;
  return path.join(paths.logsDir || '.genie/state/agents/logs', filename);
}