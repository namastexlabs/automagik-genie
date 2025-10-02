# Technical Stack (Template)

This template is domain-agnostic. Choose technologies appropriate for your project. Below are examples; replace as needed.

## Core
- CLI: Node/TypeScript (`./genie`)
- Agents: Markdown prompts under `.genie/agents/`
- State: `.genie/state/` (logs, sessions)

## Optional Runtimes (examples)
- Backend: Rust, Node/TS, Python, Go
- Database: SQLite, Postgres, or project-specific
- UI: Any framework or none

## CI/CD (examples)
- GitHub Actions for lint/test
- Docker for packaging

## Observability (examples)
- Logs: JSON structured logs
- Metrics: your preferred stack

Keep this file minimal and project-neutral so the template installs cleanly anywhere.
