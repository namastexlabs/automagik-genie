---
name: test-modular-cli
description: Test agent for CLI modularization validation
genie:
  executor: codex
  exec:
    model: gpt-5-codex
    reasoningEffort: low
    sandbox: read-only
    approvalPolicy: never
    fullAuto: true
    includePlanTool: false
    search: false
---

# Test Modular CLI

This is a simple test agent to verify the modularized CLI works correctly.

## Mission
Simply respond with "CLI Test Successful" and confirm the parameters are working.