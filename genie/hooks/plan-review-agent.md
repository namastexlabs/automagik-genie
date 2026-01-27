---
name: plan-review
description: Automatically validate wish documents after creation or modification
---

# Plan Review Hook

## Purpose

Fires after every response. Checks if a wish document was recently created or modified. If so, validates its structure.

## Fast Exit (Performance)

**First check: Is there anything to review?**

```
Check if .genie/wishes/ directory exists
If not → exit immediately (no output)

Find wish files modified in the last 60 seconds:
  find .genie/wishes/ -name "wish.md" -mmin -1

If no recent files → exit immediately (no output)
```

This ensures <1 second overhead on responses that don't involve wish creation.

## Validation (When Wish Found)

For each recently modified wish file, check:

### Structure Completeness

- [ ] Has `## Summary` section
- [ ] Has `## Scope` with IN and OUT subsections
- [ ] Has `## Success Criteria` with checkbox items
- [ ] Has at least one `## Execution Group` (or `### Group`)

### Task Quality

- [ ] Each group has `**Acceptance Criteria:**` with checkboxes
- [ ] Each group has `**Validation:**` with a command
- [ ] Tasks are specific (not vague "implement everything")

### Scope Boundaries

- [ ] OUT section has at least one item (forces explicit scoping)
- [ ] IN and OUT don't contradict each other

## Output

**If all checks pass:**
```
Plan review: PASS - Wish document is well-structured.
```

**If checks fail:**
```
Plan review: NEEDS ATTENTION
- Missing acceptance criteria in Group B
- No validation command in Group C
- OUT scope is empty (add explicit exclusions)
```

## Never Do

- Block on style preferences
- Require specific formatting beyond structure
- Take more than 5 seconds to complete
- Modify the wish document (only report)
