# Product Documentation Analysis & Recommendations

## Current Documentation State (Sept 27, 2025)

### Strengths
1. **Latency targets now consistent**: TTFB goals align across README, metrics, architecture, research, and ElevenLabs findings (200 ms P50 / 300 ms P99 grounded in production data).
2. **Core references in place**: README, ARCHITECTURE, metrics, roadmap, and research docs provide a coherent overview for new contributors.
3. **Production evidence integrated**: `docs/elevenlabs/production-insights.md` anchors priorities with 150+ conversation analysis and is cited throughout planning docs.
4. **Environment catalog complete**: `.agent-os/product/environment.md` covers runtime, speech, overlap, and experimental toggles with evidence citations.
5. **Protocol fidelity documented**: `docs/websocket-protocol.md` and `docs/transcript-schema.md` mirror ElevenLabs payloads, reducing ambiguity for implementers.

### Documentation Map
- **Product**: mission, mission-lite, tech-stack, roadmap, environment, planning session log
- **Architecture & research**: ARCHITECTURE, research blueprint, audio pipeline, websocket protocol
- **Provider learnings**: elevenlabs key findings & production insights, livekit analyses
- **Experiments**: AH-001 artifacts, prompts, QA flows
- **Repo onboarding**: README, AGENTS guidelines, CLAUDE instructions

## Refined Gaps & Cleanup Opportunities

1. **Research doc still dense** (`docs/research.md` ~200 lines)
   - Mixes strategic blueprint, benchmark instructions, and Python POC. Consider modularizing into `research.md` (overview), `providers.md`, `benchmarks.md`, or adding anchors/ToC for faster navigation.

2. **Roadmap language partially timeboxed** (`.agent-os/product/roadmap.md`)
   - Phase headers keep “Week X-Y” phrasing. Replace with milestone-based wording to avoid stale schedules while retaining sequencing.

3. **Tech stack maintenance** (`.agent-os/product/tech-stack.md`)
   - Newly added version constraints should be revisited whenever dependencies bump; consider adding a changelog snippet or table to track drift over time.

4. **Experiment templates TBD**
   - `AGENTS.md` references future templates (`templates/`), but directory absent. Either create stubs or remove promise until available.

## Recommended Actions (ordered)

1. **Reshape research corpus**
   - Split or table-of-contents the blueprint so strategy vs execution notes are easier to reference mid-implementation.

2. **Update roadmap headers**
   - Swap “Week X-Y” labels for milestone names (“Milestone: MVP ready for beta”) to keep document evergreen.

3. **Track tech stack drift**
   - Capture dependency/version changes (Tokio, Axum, VAD crates) in a lightweight changelog block whenever upgrades happen.

4. **Clarify experiment template roadmap**
   - Either add placeholder files under `templates/` or adjust AGENTS guidelines to mark them “planned.”

## Success Criteria
- Every latency reference reflects the 200 ms P50 / 300 ms P99 goal (validated ✅)
- Contributors can find architectural context, provider notes, and protocol schemas without cross-referencing stale docs
- Remaining TODOs are explicit (gaps above) rather than implied by out-of-date audits

## Maintenance Tips
- Re-run this audit after major doc restructuring or before public releases.
- When latency targets change, update metrics.md first and propagate via search to avoid drift.
- Keep environment defaults aligned with sample `.env` files to prevent onboarding friction.
1. **Single Source of Truth**: Each fact should exist in exactly one place
2. **Cross-references**: Use relative links between documents
3. **Version tracking**: Document which version of the system each doc describes
4. **Regular audits**: Review for accuracy after each phase completion
5. **User feedback**: Track confusion points and clarify

## Quick Wins

Immediate improvements (< 1 hour each):
1. Expand the new ToC in `docs/research.md` with subsection anchors for provider evidence and operational guidance.
2. Add a simple `templates/README.md` placeholder so AGENTS promises match the repo.
3. Add a change notes section to `.agent-os/product/tech-stack.md` for dependency bumps.
4. Link the API overview directly from `docs/management-api.md` to keep readers in sync.
5. Add a short "First run" reminder to the getting-started guide once the server crate is published.
