# Background Session Management

## Overview

Background sessions allow long-running agent tasks to execute without blocking your workflow. This is essential for research, analysis, and complex implementation tasks.

## When to Use Background Sessions

### Good Candidates for Background
- Deep codebase analysis
- Comprehensive testing runs
- Research across multiple files
- Documentation generation
- Performance profiling
- Multi-file refactoring

### Keep in Foreground
- Quick questions
- Single file edits
- Interactive debugging
- Tasks requiring immediate feedback

## Starting Background Sessions

### Basic Usage

```bash
# Single background task
./.genie/cli/agent.js chat forge-coder \
  "analyze all WebSocket implementations" \
  --background

# Returns immediately with session ID
# Output: Started background session: forge-coder-abc123
```

### Parallel Background Tasks

Launch multiple agents simultaneously for different aspects:

```bash
# Performance analysis
./.genie/cli/agent.js chat forge-quality \
  "@.genie/product/metrics.md identify bottlenecks" \
  --background

# Security audit
./.genie/cli/agent.js chat forge-hooks \
  "audit authentication patterns" \
  --background

# Test coverage
./.genie/cli/agent.js chat forge-tests \
  "measure test coverage gaps" \
  --background
```

## Monitoring Background Work

### List Active Sessions

```bash
./.genie/cli/agent.js list

# Output:
# Active sessions:
# - forge-coder-abc123 (running, 5m)
# - forge-quality-def456 (running, 3m)
# - forge-tests-ghi789 (completed, 10m)
```

### View Real-time Logs

```bash
# Tail specific session
tail -f .genie/state/agents/logs/forge-coder-abc123.log

# Monitor all active sessions
tail -f .genie/state/agents/logs/*.log

# Search logs for specific patterns
grep "ERROR" .genie/state/agents/logs/*.log
```

### Check Session Status

```bash
# Detailed status (future feature)
./.genie/cli/agent.js status forge-coder-abc123
```

## Managing Session Output

### Log Storage Structure

```
.genie/state/agents/
├── sessions.json          # Session index
├── logs/
│   ├── forge-coder-abc123.log
│   ├── forge-quality-def456.log
│   └── forge-tests-ghi789.log
└── background/            # Reserved for metadata
```

### Capturing Results in Wishes

Background outputs should be referenced in wish documents:

```markdown
## Context Ledger
| Source | Type | Summary | Distributed To |
| --- | --- | --- | --- |
| forge-coder-abc123 | background | WebSocket analysis found 3 implementations | wish, forge plan |
| forge-quality-def456 | background | Identified 5 performance bottlenecks | wish, metrics doc |
```

### Extracting Key Findings

```bash
# Extract summary from completed session
tail -100 .genie/state/agents/logs/forge-coder-abc123.log | \
  grep -A5 "SUMMARY"

# Extract all recommendations
grep "RECOMMEND" .genie/state/agents/logs/forge-quality-*.log
```

## Background Session Patterns

### Research Pattern

```bash
# 1. Start research session
./.genie/cli/agent.js chat forge-coder \
  "research @docs/*.md for latency optimizations" \
  --background

# 2. Continue with other work
/wish  # Create wish while research runs

# 3. Check results when ready
tail -50 .genie/state/agents/logs/forge-coder-*.log

# 4. Incorporate findings
@context file:.genie/state/agents/logs/forge-coder-abc123.log
```

### Parallel Analysis Pattern

```bash
# Launch comprehensive analysis
for aspect in performance security testing; do
  ./.genie/cli/agent.js chat forge-quality \
    "analyze $aspect across codebase" \
    --background
done

# Monitor all
watch './.genie/cli/agent.js list'
```

### Long-running Implementation Pattern

```bash
# Start implementation
./.genie/cli/agent.js chat forge-coder \
  "@.genie/wishes/feature-wish.md implement Group A" \
  --background

# Check progress periodically
grep "PROGRESS" .genie/state/agents/logs/forge-coder-*.log

# Get completion notification (future feature)
# ./.genie/cli/agent.js notify-on-complete forge-coder-abc123
```

## Session Cleanup

### Clear Completed Sessions

```bash
# Clear specific session
./.genie/cli/agent.js clear forge-coder-abc123

# Clear all completed sessions
./.genie/cli/agent.js clear --completed

# Archive logs before clearing
tar -czf agent-logs-$(date +%Y%m%d).tar.gz .genie/state/agents/logs/
./.genie/cli/agent.js clear --all
```

### Log Rotation

Implement log rotation to prevent disk bloat:

```bash
# Rotate logs older than 7 days
find .genie/state/agents/logs -mtime +7 -delete

# Compress old logs
find .genie/state/agents/logs -mtime +1 -exec gzip {} \;
```

## Advanced Configuration

### Session Limits

Configure in `.genie/cli/agent.yaml`:

```yaml
background:
  maxConcurrent: 5        # Max parallel sessions
  defaultTimeout: 3600    # 1 hour default timeout
  logMaxSize: 10485760   # 10MB max log size
```

### Custom Presets for Background Work

```yaml
presets:
  background-research:
    description: Optimized for background research tasks
    overrides:
      exec:
        model: gpt-5-codex
        reasoning_effort: high
        includePlanTool: true
      background: true
```

## Integration with Workflow

### During /plan

```markdown
User: We need to optimize WebSocket performance
Agent: I'll start background analysis while we plan.

*Launches: ./.genie/cli/agent.js chat forge-coder "analyze WebSocket performance" --background*

Let's continue planning while that runs...
```

### In Forge Plans

```markdown
## Group A - Performance Analysis
- Background session: forge-quality-def456
- Status: Completed
- Key findings: See logs at .genie/state/agents/logs/forge-quality-def456.log
- Action items derived from analysis...
```

### For Reviews

```bash
# Aggregate all background findings for review
for log in .genie/state/agents/logs/*-completed.log; do
  echo "=== $(basename $log) ==="
  tail -20 "$log" | grep -A10 "SUMMARY"
done > .genie/wishes/<slug>/qa/background-summaries.md
```

## Best Practices

### DO
- Use background for tasks > 5 minutes
- Launch related analyses in parallel
- Reference session IDs in wishes
- Archive logs regularly
- Monitor disk usage

### DON'T
- Use background for interactive tasks
- Forget to check session results
- Leave sessions running indefinitely
- Ignore log rotation
- Launch too many parallel sessions

## Troubleshooting

### Session Appears Stuck

```bash
# Check if still running
ps aux | grep "agent.js.*forge-coder"

# View recent log activity
tail -f .genie/state/agents/logs/forge-coder-abc123.log

# Force terminate if needed
./.genie/cli/agent.js kill forge-coder-abc123
```

### Missing Log Files

```bash
# Check sessions.json for record
cat .genie/state/agents/sessions.json | jq '.sessions["forge-coder-abc123"]'

# Verify log directory exists
ls -la .genie/state/agents/logs/
```

### High Disk Usage

```bash
# Check log sizes
du -sh .genie/state/agents/logs/*

# Compress large logs
gzip .genie/state/agents/logs/*.log

# Clear old sessions
./.genie/cli/agent.js clear --older-than 7d
```

## Future Enhancements

Planned features for background sessions:

- Progress indicators and ETA
- Email/Slack notifications on completion
- Session priority levels
- Resource usage limits
- Distributed execution across machines
- Session pause/resume
- Automatic result summarization

---

For more details, see:
- [Orchestrator Workflow](./orchestrator.md)
- [CLI Agent Documentation](./.genie/cli/README.md)
- [Agent Configuration](./.genie/cli/agent.yaml)