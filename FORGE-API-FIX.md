# Forge API Inconsistency Fix

**Date:** 2025-10-28
**Issue:** HTML vs JSON responses from Forge API endpoints
**Root Cause:** Incorrect API endpoints in `forge/index.ts`
**Priority:** Medium (affects MCP tool reliability)

## Problem Summary

Some Forge API endpoint calls were returning HTML pages instead of JSON, causing parse errors in client code. Investigation revealed:

1. **Wrong endpoints** used in `forge/index.ts`
2. **Catch-all frontend route** returning HTML for non-existent API paths
3. **Inconsistent client implementations** (forge.js vs forge/index.ts)

## Root Cause Analysis

### The Issue

The `forge/index.ts` file (lines 152, 177, 197, 207) was using **non-existent API endpoints**:

```typescript
// ❌ WRONG - These endpoints don't exist
POST /api/tasks/${taskId}/attempts/start
GET /api/tasks/${attemptId}
PUT /api/tasks/${attemptId}
```

When hitting these non-existent endpoints, the Forge backend's catch-all frontend route returned the HTML dashboard page instead of a JSON error response.

### Correct Endpoints (from forge.js)

```typescript
// ✅ CORRECT - These are the actual Forge API endpoints
POST /api/tasks/create-and-start         // Create task + start attempt atomically
GET /api/task-attempts/{id}              // Get task attempt by ID
POST /api/task-attempts/{id}/follow-up   // Send follow-up prompt
POST /api/task-attempts/{id}/stop        // Stop execution
```

### API Client Hierarchy

**Canonical API Client:** `forge.js` (980+ lines, complete API coverage)
- Used by Forge MCP server (`forge/mcp/src/lib/forge-client.ts`)
- Complete documentation with 80+ endpoints
- Correct endpoint paths
- Wraps responses properly

**Legacy/Test Client:** `forge/index.ts` (223 lines, minimal implementation)
- Originally created for Wish #120-A integration
- Only used by 2 test files in `.genie/cli/`
- Had incorrect endpoints
- Should have been referencing `forge.js` from the start

## Changes Made

### 1. Fixed `forge/index.ts` Endpoints

#### createAndStartTask (line 138)

**Before:**
```typescript
// Two separate API calls with wrong endpoints
const taskResult = await this.request('POST', `/api/projects/${projectId}/tasks`, {...});
const attemptResult = await this.request('POST', `/api/tasks/${taskId}/attempts/start`, {...});
```

**After:**
```typescript
// Single atomic call with correct endpoint
const result = await this.request('POST', '/api/tasks/create-and-start', {
  task: {
    project_id: projectId,
    title: taskData.title,
    description: taskData.description,
  },
  executor_profile_id: taskData.executor_profile_id,
  base_branch: taskData.base_branch,
});
```

#### getTaskAttempt (line 172)

**Before:**
```typescript
const result = await this.request('GET', `/api/tasks/${attemptId}`); // Wrong endpoint
```

**After:**
```typescript
const result = await this.request('GET', `/api/task-attempts/${attemptId}`); // Correct
```

#### followUpTaskAttempt (line 197)

**Before:**
```typescript
await this.request('PUT', `/api/tasks/${attemptId}`, {
  description: prompt,
});
```

**After:**
```typescript
await this.request('POST', `/api/task-attempts/${attemptId}/follow-up`, {
  follow_up_prompt: prompt,
});
```

#### stopTaskAttemptExecution (line 207)

**Before:**
```typescript
await this.request('PUT', `/api/tasks/${attemptId}`, {
  status: 'cancelled',
});
```

**After:**
```typescript
await this.request('POST', `/api/task-attempts/${attemptId}/stop`);
```

### 2. Added HTML Detection

Added Content-Type checking in `request()` method (line 89) to detect HTML responses early:

```typescript
// Check Content-Type to detect HTML responses (wrong endpoint)
const contentType = response.headers.get('content-type') || '';
if (contentType.includes('text/html')) {
  throw new Error(
    `Forge API returned HTML instead of JSON. This likely means the endpoint ${path} doesn't exist. ` +
    `Status: ${response.status}. Check the API documentation in forge.js for correct endpoints.`
  );
}
```

### 3. Updated Test Files

Updated test imports to use canonical `forge.js`:

```typescript
// Before
import { ForgeClient } from '../../forge';

// After
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ForgeClient } = require('../../forge.js');
```

**Files Updated:**
- `.genie/cli/test-1-simple.ts`
- `.genie/cli/test-1-project-creation.ts`

## Forge API Endpoint Reference

### Task Management

| Operation | Method | Endpoint | forge.js line |
|-----------|--------|----------|---------------|
| List tasks | GET | `/api/projects/{project_id}/tasks` | 254 |
| Create task | POST | `/api/projects/{project_id}/tasks` | 264 |
| Create + start | POST | `/api/tasks/create-and-start` | 274 |
| Get task | GET | `/api/projects/{project_id}/tasks/{task_id}` | 286 |
| Update task | PUT | `/api/projects/{project_id}/tasks/{task_id}` | 297 |
| Delete task | DELETE | `/api/projects/{project_id}/tasks/{task_id}` | 307 |

### Task Attempt Management

| Operation | Method | Endpoint | forge.js line |
|-----------|--------|----------|---------------|
| List attempts | GET | `/api/task-attempts?task_id={id}` | 319 |
| Create attempt | POST | `/api/task-attempts` | 329 |
| Get attempt | GET | `/api/task-attempts/{id}` | 338 |
| Follow up | POST | `/api/task-attempts/{id}/follow-up` | 349 |
| Stop execution | POST | `/api/task-attempts/{id}/stop` | 473 |
| Get branch status | GET | `/api/task-attempts/{id}/branch-status` | 372 |
| Rebase | POST | `/api/task-attempts/{id}/rebase` | 382 |
| Merge | POST | `/api/task-attempts/{id}/merge` | 393 |
| Push | POST | `/api/task-attempts/{id}/push` | 401 |
| Create PR | POST | `/api/task-attempts/{id}/pr` | 420 |

## Testing Validation

### Before Fix
```bash
# Would return HTML page, causing JSON parse errors
curl http://localhost:8887/api/tasks/abc123
# <html>...Forge Dashboard...</html>
```

### After Fix
```bash
# Now properly calls correct endpoint
curl http://localhost:8887/api/task-attempts/abc123
# {"success":true,"data":{"id":"abc123",...}}

# Or returns proper JSON error for non-existent resource
curl http://localhost:8887/api/task-attempts/invalid
# {"success":false,"message":"Task attempt not found"}
```

## Future Recommendations

### 1. Deprecate `forge/index.ts`

Consider removing `forge/index.ts` entirely and having test files import from `forge.js` directly:

```typescript
// Option A: Direct require (current approach)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ForgeClient } = require('./forge.js');

// Option B: Convert forge.js to TypeScript module
// Rename forge.js → forge.ts, use ESM exports
import { ForgeClient } from './forge.js';
```

### 2. Add Backend Endpoint Validation

Add a middleware in Forge backend to return JSON errors for unknown `/api/*` routes instead of serving HTML:

```rust
// In Forge router (conceptual - actual implementation in Rust)
if path.starts_with("/api/") && !known_api_route(path) {
  return json_error(404, "API endpoint not found")
}
```

### 3. Add Integration Tests

Create integration tests that validate:
- All endpoints in `forge.js` return JSON (not HTML)
- All MCP tools can successfully communicate with Forge
- Error responses are properly formatted JSON

## Related Files

**Fixed:**
- `forge/index.ts` - Corrected all endpoint paths
- `.genie/cli/test-1-simple.ts` - Updated to use forge.js
- `.genie/cli/test-1-project-creation.ts` - Updated to use forge.js

**Reference (Canonical):**
- `forge.js` - Complete Forge API client (80+ endpoints)
- `forge/mcp/src/lib/forge-client.ts` - MCP wrapper around forge.js

**Documentation:**
- This file (`FORGE-API-FIX.md`)

## Success Criteria

- ✅ No more HTML responses when expecting JSON
- ✅ All API calls use correct endpoints
- ✅ Proper error messages when endpoint doesn't exist
- ✅ Test files use canonical API client (forge.js)
- ✅ MCP tools parse responses correctly

## Lessons Learned

1. **Single Source of Truth:** `forge.js` should be the only API client implementation
2. **Early Detection:** Content-Type validation catches wrong endpoints immediately
3. **Documentation:** Complete API reference prevents endpoint misuse
4. **Consistency:** All clients should wrap the same canonical implementation
