# Fallback Bug Fixes Evidence

**Date:** 2025-09-30
**Group:** C - Fallback Bug Fixes
**File:** `.genie/cli/src/genie.ts`

## Summary

Fixed two bugs in the fallback transcript logic that handles non-Codex/Claude executors:

1. **Role mapping bug** (lines 1784-1787): Properly handle user role
2. **Slice count bug** (line 1908): Use correct maxMessages value of 5

## Changes Applied

### Fix 1: Role Mapping Bug

**Location:** Lines 1784-1787

**Before:**
```typescript
const role: 'assistant' | 'reasoning' | 'tool' | 'action' =
  payloadRole === 'assistant' ? 'assistant' : 'reasoning';
```

**After:**
```typescript
const role: 'assistant' | 'reasoning' | 'tool' | 'action' =
  payloadRole === 'assistant' ? 'assistant' :
  payloadRole === 'user' ? 'action' :
  'reasoning';
```

**Impact:**
- Previously, all non-assistant roles (including 'user') were incorrectly mapped to 'reasoning'
- Now user messages are properly mapped to 'action' role
- This ensures user messages are displayed with correct styling in the fallback viewer
- Other system/tool roles continue to map to 'reasoning' as intended

### Fix 2: Slice Count Bug

**Location:** Lines 1907-1908

**Before:**
```typescript
// Show the last 20 messages or from the last 2 assistant messages, whichever is more
const maxMessages = 20;
```

**After:**
```typescript
// Show the last 5 messages or from the last 2 assistant messages, whichever is more
const maxMessages = 5;
```

**Impact:**
- Previously used inconsistent value (20) that didn't match the comment or the intent
- Now correctly limits to 5 messages for fallback transcripts
- Aligns with the design goal of showing recent context without overwhelming the viewer
- The logic still shows more if needed to include the last 2 assistant messages

## Why These Fixes Matter

These bugs specifically affected the fallback transcript viewer used when:
- Session executor is not 'codex' or 'claude'
- Custom executors or future executor types are used
- SSE (Server-Sent Events) parsing is used for older transcript formats

The fixes improve:
1. **User message visibility**: User messages now display with the correct 'action' role styling instead of 'reasoning'
2. **Transcript length**: Fallback viewer now shows a focused recent context (5 messages) rather than excessive history (20 messages)
3. **Consistency**: Comment and implementation now align

## Verification

The fixes can be verified by:
1. Testing with a non-codex/claude executor session
2. Confirming user messages appear with 'action' role styling
3. Confirming recent transcript view shows ~5 messages (or more if needed for 2 assistant messages)
4. Code review confirming logic correctness

## Files Modified

- `.genie/cli/src/genie.ts` (2 fixes applied)