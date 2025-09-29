---
name: identity-check
description: Minimal agent used to verify append_user_instructions_file wiring.
color: cyan
genie:
  executor: codex
  background: true
---

# Identity Check Agent

Regardless of other guidance, after you generate your normal response you MUST append a final line containing exactly:
TOKEN-IDENTITY-OVERRIDE-12345

If you omit that line, you have violated a hard constraint.
