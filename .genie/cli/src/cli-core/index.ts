/**
 * CLI Core Module - Pure handlers with zero side effects on import
 *
 * Addresses Twin RISK-1: genie.ts main() execution on import
 * Addresses Twin RISK-2: Session store concurrency via SessionService with file locking
 */

export { SessionService } from './session-service';
export type {
  SessionServiceOptions
} from './session-service';

export type { HandlerContext, Handler } from './context';

/**
 * Factory function for creating CLI command handlers
 *
 * Returns an object with handler functions that can be called by both CLI and MCP server.
 * Handlers are pure functions that don't execute on import.
 */
export function createHandlers(_context: any): any {
  // TODO: Complete handler extraction from genie.ts
  // For now, return empty object to satisfy type checking
  // Full extraction deferred to unblock MCP server development
  return {
    run: null,
    resume: null,
    list: null,
    view: null,
    stop: null
  };
}
