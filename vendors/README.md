Vendors (Template Notice)

This directory contains upstream repositories added as Git submodules for research and interop. When installing this Genie template into a target repository, treat vendor docs as examples and adapt or ignore them based on your project’s {{DOMAIN}} and {{TECH_STACK}}.

Included submodules
- vendors/hume-evi-next-js-starter → https://github.com/humeai/hume-evi-next-js-starter
  - Purpose: study UI/flow and conversational UX patterns you can adapt in your own projects.

Workflow
- Update submodules: `git submodule update --init --recursive`
- Pull latest from upstreams: `git submodule foreach git pull origin HEAD`
- Pin a revision when referencing code: prefer commit SHAs in docs to keep reproducible evaluations.

Vendor lock-in considerations
- Treat these repos as reference implementations. We copy patterns, not code, into our Rust runtime unless licensing/fit is vetted.
- Keep our hot path (WS, scheduling, partial flush, VAD/overlap policy) in Rust. Use upstream ideas for strategy and metrics.
- Evaluate cost/latency trade-offs independently; avoid hard dependencies that block local/offline fallbacks.

Pointers
- Hume starter: Next.js scaffolding for conversational UI and metrics overlays you can borrow for `examples/demo-ui/` later.

Additional vendor usage notes can be added per project as needed.

Additional examples can be added as separate submodules when needed.

Hume EVI Next.js Starter — Notes
- Location: `vendors/hume-evi-next-js-starter`
- Use to study conversational UI patterns and EVI wiring; follow upstream README to run.
