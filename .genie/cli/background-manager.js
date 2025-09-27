const { spawn } = require('child_process');
const EventEmitter = require('events');

const INTERNAL_BACKGROUND_ENV = 'GENIE_AGENT_BACKGROUND_RUNNER';
const INTERNAL_START_TIME_ENV = 'GENIE_AGENT_START_TIME';
const INTERNAL_LOG_PATH_ENV = 'GENIE_AGENT_LOG_FILE';

class BackgroundManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.execPath = options.execPath || process.execPath;
    this.children = new Map(); // pid -> metadata
  }

  launch(options = {}) {
    const {
      rawArgs = [],
      startTime = Date.now(),
      logFile,
      backgroundConfig = {},
      scriptPath,
      env: extraEnv = {}
    } = options;

    if (!backgroundConfig || backgroundConfig.enabled === false) {
      throw new Error('Background execution is disabled in configuration.');
    }
    if (!scriptPath) {
      throw new Error('BackgroundManager.launch requires a scriptPath.');
    }

    const spawnEnv = {
      ...process.env,
      ...extraEnv,
      [INTERNAL_BACKGROUND_ENV]: '1',
      [INTERNAL_START_TIME_ENV]: String(startTime),
      [INTERNAL_LOG_PATH_ENV]: logFile
    };

    const child = spawn(this.execPath, [scriptPath, ...rawArgs], {
      detached: Boolean(backgroundConfig.detach),
      stdio: backgroundConfig.detach ? 'ignore' : 'inherit',
      env: spawnEnv
    });

    const metadata = {
      pid: child.pid,
      rawArgs: [...rawArgs],
      logFile,
      startTime,
      launchedAt: new Date(),
      detach: Boolean(backgroundConfig.detach)
    };

    if (child.pid) {
      this.children.set(child.pid, metadata);
    }

    child.on('exit', (code, signal) => {
      metadata.exitCode = code;
      metadata.signal = signal;
      metadata.exitedAt = new Date();
      if (child.pid) {
        this.children.delete(child.pid);
      }
      this.emit('exit', metadata);
    });

    child.on('error', (error) => {
      metadata.error = error;
      this.emit('error', metadata, error);
    });

    if (backgroundConfig.detach) {
      child.unref();
    }

    return child.pid;
  }

  stop(pid, signal = 'SIGTERM') {
    if (!pid || typeof pid !== 'number') return false;
    try {
      process.kill(pid, signal);
      return true;
    } catch (error) {
      if (error && error.code === 'ESRCH') return false;
      throw error;
    }
  }

  isAlive(pid) {
    if (!pid || typeof pid !== 'number') return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      if (error && error.code === 'EPERM') return true;
      return false;
    }
  }

  get(pid) {
    return this.children.get(pid) || null;
  }

  list() {
    return Array.from(this.children.values());
  }
}

module.exports = {
  BackgroundManager,
  INTERNAL_BACKGROUND_ENV,
  INTERNAL_START_TIME_ENV,
  INTERNAL_LOG_PATH_ENV
};
