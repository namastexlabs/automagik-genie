import type { CLIOptions, ParsedCommand } from './types';

export function parseArguments(argv: string[]): ParsedCommand {
  const raw = argv.slice();
  const command = raw.shift()?.toLowerCase();
  const options: CLIOptions = {
    rawArgs: argv.slice(),
    background: false,
    backgroundExplicit: false,
    backgroundRunner: false,
    requestHelp: undefined,
    full: false,
    live: false
  };

  const filtered: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const token = raw[i];
    if (token === '--help' || token === '-h') {
      options.requestHelp = true;
      continue;
    }
    if (token === '--full') {
      options.full = true;
      continue;
    }
    if (token === '--live') {
      options.live = true;
      continue;
    }
    if (token === '--') {
      filtered.push(...raw.slice(i + 1));
      break;
    }
    filtered.push(token);
  }

  return { command, commandArgs: filtered, options };
}