# Issues Found During QA

## Issue #1: Sessions.json Dependency Bug (CRITICAL)

**Priority:** P0
**Severity:** Critical
**Status:** Blocks commit
**Discovered:** 2025-09-30T00:58 UTC
**Affects:** view command, resume command

---

### Description

Both `view` and `resume` commands fail with "No run found with session id" error when the session is not tracked in `.genie/state/agents/sessions.json`, even though:
- Valid session file exists in `~/.codex/sessions/`
- Session ID is correct and matches filename
- Session file contains full conversation history

This makes it impossible to view or resume orphaned sessions through normal CLI commands.

---

### Steps to Reproduce

1. Identify a session file that exists in `~/.codex/sessions/` but not in sessions.json:
   ```bash
   find ~/.codex/sessions -name "*.jsonl" | head -1
   # Example: rollout-2025-09-29T21-48-56-01999818-09e9-74c2-926b-d2250a2ae3c7.jsonl
   ```

2. Extract session ID from filename: `01999818-09e9-74c2-926b-d2250a2ae3c7`

3. Verify it's NOT in sessions.json:
   ```bash
   cat .genie/state/agents/sessions.json | grep "01999818"
   # No results
   ```

4. Try to view:
   ```bash
   ./genie view 01999818-09e9-74c2-926b-d2250a2ae3c7
   # ❌ Run not found
   ```

5. Try to resume:
   ```bash
   ./genie resume 01999818-09e9-74c2-926b-d2250a2ae3c7 "test message"
   # ❌ No run found with session id
   ```

---

### Expected Behavior

**For view command:**
- Should attempt to locate session file in `~/.codex/sessions/` even without sessions.json entry
- If session file found, display its content with a warning about missing CLI tracking
- Only fail if session file truly doesn't exist anywhere

**For resume command:**
- Should detect if session file exists but is orphaned
- Provide helpful error message explaining the situation
- Suggest recovery options or starting a new session

---

### Current Behavior

Both commands fail immediately at sessions.json lookup without attempting to find the session file.

**Error output:**
```
❌ No run found with session id '01999818-09e9-74c2-926b-d2250a2ae3c7'
```

No indication that session file might exist elsewhere or how to recover.

---

### Root Cause

**Affected Files:**
- `/home/namastex/workspace/automagik-genie/.genie/cli/src/genie.ts`

**View Command (Lines 1153-1156):**
```typescript
const found = findSessionEntry(store, sessionId, paths);
if (!found) {
  await emitView(buildErrorView('Run not found',
    `No run found with session id '${sessionId}'`),
    parsed.options, { stream: process.stderr });
  return;  // ❌ Returns immediately without checking session files
}
```

**Resume Command (Lines 982-983):**
```typescript
const found = findSessionEntry(store, sessionId, paths);
if (!found) throw new Error(`❌ No run found with session id '${sessionIdArg}'`);
// ❌ Throws immediately without checking session files
```

**Design Issue:**
Both commands assume sessions.json is the single source of truth. They don't attempt fallback to direct session file lookup when sessions.json entry is missing.

---

### Impact Assessment

**Severity: CRITICAL**

**Who is affected:**
- Users whose sessions.json was corrupted or deleted
- Users with session files from before robust CLI tracking
- Users experiencing CLI crashes that prevent session registration
- Users manually cleaning up state directories

**What breaks:**
- Cannot view conversation history for orphaned sessions
- Cannot resume work from orphaned sessions
- No way to recover or inspect session files through CLI
- User must manually read JSONL files to see conversation history

**Scope:**
- Potentially affects many existing sessions in production
- Affects the exact scenario reported by user (session `01999818...`)
- Makes session recovery workflows impossible

---

### Proposed Fix

#### Part 1: Add Session File Discovery Helper

Create function in `codex.ts` or new utility module:

```typescript
/**
 * Attempt to locate session file by session ID alone
 * Searches ~/.codex/sessions/ directory tree for matching files
 */
function tryLocateSessionFileBySessionId(
  sessionId: string,
  sessionsDir: string
): string | null {
  if (!sessionId || !sessionsDir || !fs.existsSync(sessionsDir)) {
    return null;
  }

  // Search pattern: look in recent date directories
  const now = new Date();
  const searchDates = [0, -1, -2].map(offset => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return d;
  });

  for (const date of searchDates) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayDir = path.join(sessionsDir, String(year), month, day);

    if (!fs.existsSync(dayDir)) continue;

    const files = fs.readdirSync(dayDir);
    const pattern = new RegExp(`-${sessionId}\\.jsonl$`, 'i');

    for (const file of files) {
      if (pattern.test(file)) {
        return path.join(dayDir, file);
      }
    }
  }

  return null;
}
```

#### Part 2: Update View Command

```typescript
async function runView(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const [sessionId] = parsed.commandArgs;
  if (!sessionId) {
    await emitView(buildInfoView('View usage', ['Usage: genie view <sessionId> [--full]']), parsed.options);
    return;
  }

  const warnings: string[] = [];
  const store = loadSessions(
    paths as SessionPathsConfig,
    config as SessionLoadConfig,
    DEFAULT_CONFIG as any,
    { onWarning: (message) => warnings.push(message) }
  );

  // Try sessions.json first
  let found = findSessionEntry(store, sessionId, paths);
  let orphanedSession = false;

  // If not found in sessions.json, try direct session file lookup
  if (!found) {
    const executorKey = config.defaults?.executor || DEFAULT_EXECUTOR_KEY;
    const executor = requireExecutor(executorKey);

    if (executor.resolvePaths) {
      const executorConfig = config.executors?.[executorKey] || {};
      const executorPaths = executor.resolvePaths({
        config: executorConfig,
        baseDir: paths.baseDir,
        resolvePath: (target: string, base?: string) =>
          path.isAbsolute(target) ? target : path.resolve(base || paths.baseDir || '.', target)
      });

      const sessionsDir = executorPaths.sessionsDir;
      if (sessionsDir) {
        const sessionFile = tryLocateSessionFileBySessionId(sessionId, sessionsDir);
        if (sessionFile && fs.existsSync(sessionFile)) {
          // Create minimal entry for orphaned session
          orphanedSession = true;
          warnings.push('⚠️  Session not tracked in CLI state. Displaying from session file.');

          // Read session file directly
          const content = fs.readFileSync(sessionFile, 'utf8');
          // Parse and display (similar to existing logic)
          // ... (implementation continues)

          return;
        }
      }
    }

    // Truly not found
    await emitView(buildErrorView('Run not found',
      `No run found with session id '${sessionId}'`),
      parsed.options, { stream: process.stderr });
    return;
  }

  // Continue with existing logic for tracked sessions
  // ...
}
```

#### Part 3: Update Resume Command

```typescript
async function runContinue(parsed: ParsedCommand, config: GenieConfig, paths: Required<ConfigPaths>): Promise<void> {
  const cmdArgs = parsed.commandArgs;
  if (cmdArgs.length < 2) {
    throw new Error('Usage: genie resume <sessionId> "<prompt>"');
  }

  const store = loadSessions(paths as SessionPathsConfig, config as SessionLoadConfig, DEFAULT_CONFIG as any);
  const sessionIdArg = cmdArgs[0];
  const prompt = cmdArgs.slice(1).join(' ').trim();
  const found = findSessionEntry(store, sessionIdArg, paths);

  if (!found) {
    // Check if session file exists but is orphaned
    const executorKey = config.defaults?.executor || DEFAULT_EXECUTOR_KEY;
    const executor = requireExecutor(executorKey);

    if (executor.resolvePaths) {
      const executorConfig = config.executors?.[executorKey] || {};
      const executorPaths = executor.resolvePaths({
        config: executorConfig,
        baseDir: paths.baseDir,
        resolvePath: (target: string, base?: string) =>
          path.isAbsolute(target) ? target : path.resolve(base || paths.baseDir || '.', target)
      });

      const sessionsDir = executorPaths.sessionsDir;
      if (sessionsDir) {
        const sessionFile = tryLocateSessionFileBySessionId(sessionIdArg, sessionsDir);
        if (sessionFile && fs.existsSync(sessionFile)) {
          throw new Error(
            `❌ Session '${sessionIdArg}' is not tracked in CLI state.\n\n` +
            `Session file exists at:\n  ${sessionFile}\n\n` +
            `This session cannot be resumed because CLI tracking information is missing.\n` +
            `This may happen if sessions.json was corrupted or deleted.\n\n` +
            `Options:\n` +
            `  1. View the session: ./genie view ${sessionIdArg}\n` +
            `  2. Start a new session: ./genie run <agent> "<prompt>"\n` +
            `  3. (Advanced) Manually restore sessions.json entry`
          );
        }
      }
    }

    throw new Error(`❌ No run found with session id '${sessionIdArg}'`);
  }

  // Continue with existing logic
  // ...
}
```

---

### Testing Requirements

After implementing fix, re-test:

1. **Orphaned Session View:**
   ```bash
   ./genie view 01999818-09e9-74c2-926b-d2250a2ae3c7
   # Should display session content with warning
   ```

2. **Orphaned Session Resume:**
   ```bash
   ./genie resume 01999818-09e9-74c2-926b-d2250a2ae3c7 "test"
   # Should show helpful error with recovery options
   ```

3. **Normal Session View (Regression):**
   ```bash
   ./genie run utilities/thinkdeep "test"
   ./genie view <sessionId>
   # Should work as before
   ```

4. **Normal Session Resume (Regression):**
   ```bash
   ./genie resume <sessionId> "follow-up"
   # Should work as before
   ```

5. **Truly Missing Session:**
   ```bash
   ./genie view 00000000-0000-0000-0000-000000000000
   # Should show "Run not found" error
   ```

---

### Alternative Solutions Considered

**Option A: Session Recovery Command**
- Add `./genie recover-sessions` command to rebuild sessions.json
- Pros: Fixes root cause, batch recovery
- Cons: Requires user action, doesn't fix view/resume directly

**Option B: Auto-recovery on Startup**
- CLI validates sessions.json against session files on startup
- Pros: Transparent recovery
- Cons: Startup performance impact, complexity

**Option C: Make sessions.json Optional**
- Restructure to always read from session files
- Pros: Eliminates dual-source issues
- Cons: Major refactor, breaks existing patterns

**Selected: Part 1-3 above**
- Reason: Minimal changes, preserves existing behavior, adds fallback gracefully

---

### Related Issues

- Original issue: User cannot view conversation history in resume workflow
- This fix partially addresses it but reveals deeper state management issue
- Consider architectural review of sessions.json vs session files relationship

---

### Files Requiring Changes

1. `/home/namastex/workspace/automagik-genie/.genie/cli/src/genie.ts`
   - Update `runView()` function
   - Update `runContinue()` function

2. `/home/namastex/workspace/automagik-genie/.genie/cli/src/executors/codex.ts` (or new utility)
   - Add `tryLocateSessionFileBySessionId()` helper

3. Tests (if exist):
   - Add test cases for orphaned session scenarios
   - Verify fallback logic

---

### Acceptance Criteria

- [ ] View command can display orphaned sessions with warning
- [ ] Resume command shows helpful error for orphaned sessions
- [ ] Normal workflows (tracked sessions) continue to work
- [ ] User's session `01999818-09e9-74c2-926b-d2250a2ae3c7` can be viewed
- [ ] All QA test cases pass
- [ ] Error messages are clear and actionable
- [ ] No performance regression in normal case

---

**Issue Owner:** Pending assignment
**Blocker For:** Commit of resume-view-fix wish
**Estimated Effort:** 2-3 hours implementation + 1 hour testing