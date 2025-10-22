import type { SessionService } from './session-service';
import type { ConfigPaths, GenieConfig, CLIOptions, ParsedCommand } from './types';

export type EmitViewFn = (
  content: string,
  options: CLIOptions,
  opts?: { stream?: NodeJS.WriteStream; forceJson?: boolean }
) => Promise<void>;

export interface HandlerContext {
  config: GenieConfig;
  defaultConfig: GenieConfig;
  paths: Required<ConfigPaths>;
  sessionService: SessionService;
  emitView: EmitViewFn;
  recordRuntimeWarning: (message: string) => void;
  recordStartupWarning: (message: string) => void;
}

export type Handler = (parsed: ParsedCommand) => Promise<void | any>;
