# Repository Guidelines

## Repository Self‑Awareness
- Purpose: Build and evaluate Automagik Hello — a Rust‑first, real‑time voice application framework focused on ultra‑low latency and human‑likeness. The goal is to become the fastest, most natural voice conversation stack, with an experimentation loop to reach human‑level dialog.
- Current source of truth: `.agent-os/product/mission.md`, `.agent-os/product/mission-lite.md`, `.agent-os/product/tech-stack.md`, `.agent-os/product/roadmap.md`, and `research.md`.
- External dependencies: ElevenLabs TTS (Flash v2.5; v3 alpha optional), Groq Whisper‑large‑v3‑turbo STT, local WhisperX/faster‑whisper fallback. Set `ELEVENLABS_API_KEY` and `GROQ_API_KEY`.
- Optional orchestration: Genie CLI integration if present (`.genie/`), otherwise use shell scripts and Rust binaries.
 - Environment variables: documented in `.agent-os/product/environment.md`.

## Mandatory Prompting Standards (.claude/commands/prompt.md)
- Always structure prompts using Discovery → Implementation → Verification and keep these sections explicit.
- Use Auto‑Context with `@` to load files (transcripts, metrics, strategy docs) instead of paraphrasing.
- Apply success/failure boundaries and cite evidence lines in reports; keep metrics reproducible.
- Adopt the framework’s structure; adapt content to Automagik Hello (latency/human‑likeness focus, not PagBank specifics).

## Project Structure & Module Organization
- `.agent-os/product/` — Product docs (mission, tech‑stack, roadmap)
- `research.md` — Architecture notes and links (WS control, latency, models)
- `experiments/AH-XXX/qa/` — Experiment tasks (Automagik Hello), each with QA artifacts
- `tools/` — Helper utilities (planned: metrics extractors, ElevenLabs helpers)
- `agents/` — Optional examples or prototypes (TBD)
- `templates/` — Templates for experiment/evaluator context (TBD)

Examples: `.agent-os/product/mission.md`, `research.md`.

## QA Review Tasks
- Naming: `experiments/AH-<ID>/qa/` (e.g., `experiments/AH-001/qa/`)
- Artifacts contract under `experiments/AH-XXX/qa/`:
  - `conversation.json` (raw ElevenLabs/agent JSON)
  - `transcript_raw.txt` or `transcript_raw.json` (canonical transcript)
  - `metrics.json` (TTFB, ASR confidence, TTS artifacts)
  - `report_*.md` (evaluator report) and `summary_*.json` (metadata)
- Status: create an `AH-XXX` folder per experiment; keep only required artifacts; avoid large binaries.

## Workflow Quickstart (CLI)
- Fetch conversation (requires `ELEVENLABS_API_KEY`):
  - `mkdir -p experiments/AH-001/qa`
  - `curl -sS https://api.elevenlabs.io/v1/convai/conversations/<CONV_ID> -H "xi-api-key: $ELEVENLABS_API_KEY" -o experiments/AH-001/qa/conversation.json`
- Extract raw transcript array:
  - `jq -r '.transcript' experiments/AH-001/qa/conversation.json > experiments/AH-001/qa/transcript_raw.txt`
- Quick metrics preview:
  - TTFB avg: `jq '.transcript[] | select(.type=="agent") | .ttfb' experiments/AH-001/qa/conversation.json | awk '{s+=$1;c++} END{if(c) printf "%d\n", s/c}'`
  - ASR low‑conf turns: `jq '.transcript[] | select(.type=="user") | .asr_confidence' experiments/AH-001/qa/conversation.json | awk '{if($1<0.7) l++} END{print l+0}'`

Optional (when `.genie/` is present):
- Evaluator rubric: `.genie/agents/evaluator.md` (to be added)
- Multi‑turn evaluator:
  - `node .genie/cli/agent.js chat evaluator "Score @experiments/AH-001/qa/transcript_raw.txt using @.genie/agents/evaluator.md; save to @experiments/AH-001/qa/report_baseline.md" --preset voice-eval`
  - `node .genie/cli/agent.js continue evaluator "Drill into human‑likeness; add examples and numeric deltas."`

Notes:
- Use `@` to auto‑load artifacts/prompts when using Genie.
- Prefer read‑only presets for evaluation; switch to default when editing prompts.
- Keys: set `ELEVENLABS_API_KEY`, `GROQ_API_KEY`; optional `EXPERIMENTAL_TTS_V3=1` to enable v3 alpha.

## Build, Test, and Development
- Runtime: Rust only (Axum/Tokio). Repo skeleton to be added.
- Targets (planned):
  - `server/` — WS gateway, TTS/STT clients, VAD gate, metrics
  - `examples/demo-ui/` — Minimal htmx page + AudioWorklet
  - `tools/metrics/` — Parsers for TTFB/ASR/TTS
- Local run (planned): `cargo run -p server` then open demo UI.

## Coding Style & Naming Conventions
- Rust: clear, readable, minimal lifetimes/unsafe, Tokio idioms
- Experiments: kebab‑case IDs (e.g., `ah-overlap-rapid-duplex`)
- Docs: kebab‑case, versioned directories when needed (`v1`, `v2`)
- Tasks: `experiments/AH-<ID>/qa/` for artifacts; avoid secrets
- Prompts/patterns: keep concrete, example‑driven; avoid abstract statements
 - Formatting/Linting: use `rustfmt` and `clippy` (CI recommended). Prefer small, focused diffs over broad rewrites.

## Architecture Overview (High Level)
- Real‑time pipeline: raw WebSocket control to ElevenLabs TTS (Flash v2.5; v3 alpha opt‑in), streaming STT (Groq primary; WhisperX/faster‑whisper local fallback).
- Turn‑taking: VAD + heuristics baseline; optional ASD/diarization (pyannote, etc.) for overlap and crosstalk policies.
- Experiment harness: strategy modules for prosody/backchannels/overlap policies, A/B evaluation, and per‑turn metrics (TTFB, ASR conf., artifacts).
 - Agents WS compatibility: mirror ElevenLabs Agents WebSocket handshake/events for easier interop and tooling.
 - Connection management: warm, reusable WS connections; avoid per‑turn handshakes; enable multi‑context streams for overlap experiments.

## Research‑Driven Defaults & Tradeoffs
- Hot path transport: Prefer raw WebSockets over SDKs for precise partials, `flush`, and chunk scheduling. SDKs OK for management (CRUD, lists).
- TTS choice: Default ElevenLabs Flash v2.5 (fastest TTFB ~75ms). Use Turbo v2.5 for higher fidelity. Gate v3 alpha behind `EXPERIMENTAL_TTS_V3=1`.
- STT choice: Primary Groq Whisper‑large‑v3‑turbo (low latency, cost‑efficient). Local fallback via WhisperX or faster‑whisper (quantized allowed).
- Region pinning: Fix provider regions to cut round‑trips; colocate where possible.
- Fallbacks: Local STT/TTS options for offline/edge (see matrix below) with graceful degradation.

## Latency Tuning Playbook
- Keep TTFB budget < 900ms (P99 < 1200ms):
  - Reuse WS connections; pre‑warm TTS; send partial text and `flush` early.
  - Use 120–200ms audio chunks; partial flush window ≤ 120ms.
  - Choose fast voices/models (Flash v2.5); pin regions; avoid cold starts.
- Measure continuously:
  - Log per‑turn `ttfb_ms`, `ttsa_artifacts`, `asr_confidence`.
  - Track overlap collisions and cancel‑tail latency (target < 80ms).
- Diagnose:
  - If TTFB spikes: check cold starts, network RTT, model selection, chunk sizes.
  - If artifacts rise: reduce chunk rate or switch voice/model; verify audio worklet timing.

## Turn‑Taking & Overlap Policies
- Baseline: VAD + heuristics (300–500ms silence) to mark turn‑end; allow barge‑in anytime.
- ASD/Diarization: Evaluate pyannote for crosstalk; consider small ONNX turn‑end classifier.
- Strategy ideas:
  - half_duplex (safe), rapid_duplex (fast overlaps), overlap_aware (cancel/resume with micro‑pauses).
  - Backchannels: insert subtle acknowledgements every 2–4s to improve naturalness.

## Model & Fallback Matrix
- TTS primary: ElevenLabs Flash v2.5 (WS stream‑input); Turbo v2.5 optional.
- TTS experimental: ElevenLabs v3 alpha multi‑context (explicit opt‑in; not recommended by vendor for real‑time agents).
- TTS local (experimental): VibeVoice (1.5B/7B, quantizable); ResembleAI Chatterbox (multilingual, watermarking).
- STT primary: Groq Whisper‑large‑v3‑turbo (streaming; billed min 10s).
- STT local: whisper.cpp / whisper‑rs (preloaded) or faster‑whisper; use quantized for edge.

## Experiment Themes & IDs
- Use `experiments/AH-XXX/qa/` with concise names and a README per experiment.
- Suggested first set:
  - `AH-001` — Baseline speak‑back (Flash v2.5, VAD heuristics)
  - `AH-002` — Rapid duplex overlap (partial flush tuning)
  - `AH-003` — Pyannote diarization for crosstalk
  - `AH-004` — v3 alpha multi‑context TTS (experimental flag)
  - `AH-005` — Chunk size & region pinning ablation
  - `AH-006` — Local STT fallback behavior (WhisperX/faster‑whisper)

## Provider Docs & References
- ElevenLabs TTS WebSocket (stream‑input) and multi‑context
- ElevenLabs Agents WebSocket (handshake + event schema)
- ElevenLabs Latency Optimization (Flash/Turbo, streaming, pinning)
- Real‑time generation overview (WS basics)
- Groq pricing/performance for Whisper‑large‑v3‑turbo
- Pyannote VAD/diarization, VibeVoice/Chatterbox for local TTS

## Diagrams
- Architecture and turn sequence diagrams are tracked in research; add updated images under `docs/diagrams/` when available.

## Testing & Evaluation Guidelines
- Primary goals:
  - Latency/performance: TTFB, time‑to‑stable, interruption handling
  - Human‑likeness: overlap cadence, micro‑pauses, backchannels, prosody
  - Technical fidelity: ASR accuracy/confidence, TTS artifacts, turn policy
  - Flow: coherence, balance of brevity vs richness
- Suggested weights: 35 (human‑likeness) / 35 (latency) / 20 (technical) / 10 (flow) with ±10 performance adjustment.
- Reports: cite evidence lines; include computed metrics; keep deterministic scenarios.

### Code Editing Rules
```
- Clarity and simplicity first; avoid clever one‑liners.
- Preserve existing structure; change only what’s necessary.
- Use comments sparingly to prevent ambiguity in timing/streaming logic.
- Validate locally with targeted tests/metrics before broader runs.
```

### Task‑Specific Evaluations
- Create context files describing objectives/metrics per experiment (template to be added under `templates/`).
- Example pathing (once created): `experiments/AH-001/qa/eval_objectives.md`.
- Run evaluation: with Genie (optional) or via scripts in `tools/` (to be added).

## Genie Integration (Codex CLI)
- Entry points (optional, when present):
  - `node .genie/cli/agent.js help` — overview, presets, and paths
  - Agents under `.genie/agents/`: `evaluator`, plus utilities
- Recommended presets
  - `voice-eval` — read‑only, plan tool enabled
  - Override settings via `-c` (JSON‑parsed), e.g., `-c codex.exec.model='"o4"'`
- Background mode
  - Append `--background` to stream logs to `.genie/state/agents/logs/*.log`
  - Inspect status with `node .genie/cli/agent.js list`
- Typical workflows
  - Start evaluation session (read‑only):
    - `node .genie/cli/agent.js chat evaluator "Score @experiments/AH-001/qa/transcript_raw.txt; produce rubric‑aligned report." --preset voice-eval --background`
  - Iterate with additional guidance:
    - `node .genie/cli/agent.js continue evaluator "Tighten penalties for TTS artifacting; include numeric deltas."`
  - Analyze strategy gaps:
    - `node .genie/cli/agent.js chat evaluator "Audit overlap timing vs transcript using @research.md; list missing clarifying turns." --preset debug`
- Configuration
  - File: `.genie/cli/agent.yaml` (workspace‑local; safe in read‑only contexts)
  - Defaults: `defaults.preset=careful`, preset `voice-eval` may be added
- Safety & sandboxing
  - Prefer `read-only` for evaluation; use default when editing docs/strategies
  - Use `-c codex.exec.sandbox='"workspace-write"'` for generating files

## Advanced Prompting Framework

This framework provides patterns for maximizing performance in Automagik Hello development, evaluation, and experiment execution. For the complete guide, see `.claude/prompt.md`.

### Reasoning Effort Levels
```
low:
  use_for: quick transcript/metrics reads
  tool_budget: 2–3
  pattern: gather minimal context, answer fast, state uncertainty

medium (default):
  use_for: standard evaluations and strategy tuning
  tool_budget: 5–10
  pattern: broad → focused; stop at ~70% confidence

high:
  use_for: multi‑factor latency/human‑likeness debugging
  pattern: pursue root cause, document assumptions, verify with metrics before/after
```

### Tool Preambles
- Before grouped actions, announce intent in 1–2 short sentences.
- Group related steps (e.g., “Load transcripts; compute TTFB/ASR; then score”).
- Provide brief progress updates during longer runs.

### Task Decomposition Pattern
Break complex tasks into trackable subtasks for clarity and progress monitoring.

```
<task_breakdown>
1. [Discovery] What to investigate
   - Identify affected components (server, strategies, evaluator)
   - Map dependencies (WS control, models, transcripts)
   - Document current state (version tracking, metrics)

2. [Implementation] What to change
   - Specific modifications (turn policy, prosody, chunk sizes)
   - Order of operations (adjust → test → evaluate)
   - Rollback points (version history, git commits)

3. [Verification] What to validate
   - Success criteria (human‑likeness score, TTFB metrics)
   - Test coverage (transcript scenarios, barge‑in cases)
   - Performance metrics (ASR accuracy, TTS quality)
</task_breakdown>
```

**Voice Agent Example (Automagik Hello):**
```
<task_breakdown>
1. [Discovery] Analyze AH-001 baseline
   - Review @experiments/AH-001/qa/transcript_raw.txt
   - Inspect @experiments/AH-001/qa/metrics.json for TTFB/ASR
   - Identify turn‑taking and overlap gaps

2. [Implementation] Adjust strategy
   - Switch to overlap‑aware policy; tweak VAD thresholds
   - Try TTS v3 alpha with partial flush
   - Tune chunk sizes and region pinning

3. [Verification] Validate improvements
   - Re‑score with evaluator
   - Targets: TTFB < 900ms avg; evaluator human‑likeness ≥ 8/10
   - Confirm ASR confidence > 0.8
</task_breakdown>
```

### Auto‑Context Loading with @ Pattern
Use @ symbols to automatically trigger file reading (when using Genie):

**Repository‑Specific Examples:**
```
[TASK] Evaluate conversation quality
@experiments/AH-001/qa/transcript_raw.txt
@experiments/AH-001/qa/conversation.json
@.genie/agents/evaluator.md

[CONTEXT] Strategy tuning needed
@research.md - Current real‑time architecture notes
@.agent-os/product/tech-stack.md - Stack choices
@experiments/AH-001/qa/metrics.json - Performance baseline
```

### Success/Failure Boundaries
Use visual markers to define completion criteria and restrictions:

**Automagik Hello Development:**
```
[SUCCESS CRITERIA]
✅ Evaluator score ≥ 80 (human‑likeness 35, latency 35, tech 20, flow 10)
✅ TTFB < 900ms average; P99 < 1200ms
✅ ASR confidence > 0.8 consistently
✅ No PII leakage
✅ Stable barge‑in and overlap policies

[NEVER DO]
❌ Block barge‑in
❌ Introduce long dead‑air or robotic prosody
❌ Commit API keys
❌ Skip evaluator metrics in reports
```

**Evaluation Process:**
```
[SUCCESS CRITERIA]
✅ All rubric categories scored (1‑10)
✅ Evidence lines cited from transcript
✅ Metrics computed (TTFB, ASR, TTS)
✅ Report generated in experiments/AH-XXX/qa/report.md
✅ Recommendations provided for improvements

[NEVER DO]
❌ Score without evidence citations
❌ Ignore technical metrics
❌ Generate scores > 10 or < 1
```

### Concrete Examples Over Descriptions

**Strategy Patterns — INSTEAD OF:**
```
"Make it more natural"
```

**USE:**
```markdown
<strategy overlap_aware>
1. Start TTS on partial intent (≥ 0.6 conf)
2. Allow barge‑in; cancel tail on user speech
3. Insert micro‑pauses/backchannels every 2–4s
4. Keep partial flush window ≤ 120ms
</strategy>
```

**Evaluation Scoring — INSTEAD OF:**
```
"Score the conversation quality"
```

**USE:**
```json
{
  "human_likeness": {"score": 8, "evidence": ["Line 45: natural backchannel"], "deductions": "-1 overlap collision at L78"},
  "latency": {"ttfb_avg_ms": 820, "p99_ms": 1180},
  "technical": {"asr_conf_avg": 0.86, "tts_artifacts": 1},
  "flow": {"score": 8}
}
```

**Metrics Extraction — INSTEAD OF:**
```
"Extract performance metrics from conversation"
```

**USE:**
```bash
# Extract TTFB metrics
jq '.transcript[] | select(.type=="agent") | .ttfb' experiments/AH-001/qa/conversation.json | \
  awk '{sum+=$1; count++} END {print "TTFB avg:", sum/count, "ms"}'

# Extract ASR confidence
jq '.transcript[] | select(.type=="user") | .asr_confidence' experiments/AH-001/qa/conversation.json | \
  awk '{if($1<0.7) low++} END {print "Low confidence turns:", low}'
```

### Prompt Optimization & Production Tuning

**Automagik Hello Priority Chain:**
```
1. Safety/Emergency → "Call 911" always overrides
2. Privacy/Security → Never expose PII
3. Latency → Keep sub‑second
4. Human‑likeness → Natural overlap and cadence
5. Technical fidelity → Accurate ASR; minimal TTS artifacts
```

**Template for Strategy Optimization:**
```
Analyze the overlap_aware strategy for issues:
@research.md

Context: Human‑likeness score 6/10 in AH-001
Problem: Interruptions feel abrupt and prosody is flat

What minimal changes improve cadence without hurting TTFB?
Focus on:
1. Partial flush window and chunk size
2. Micro‑pause timing and backchannels
3. VAD thresholds and tail‑cancel behavior
```

**Self‑Evaluation Pattern:**
```markdown
<self_reflection>
After each response, internally check:
1. ❌ Did I add unnatural delay beyond 300ms idle?
2. ❌ Did I block user interruptions?
3. ✅ Did I maintain natural cadence and prosody?
4. ✅ Did I keep TTFB sub‑second and avoid artifacts?

If any ❌, regenerate response without those elements
</self_reflection>
```

**Iterative Improvement Loop:**
```bash
# 1. Run evaluation (optional with Genie)
node .genie/cli/agent.js chat evaluator \
  "Score @experiments/AH-001/qa/transcript_raw.txt" \
  --preset voice-eval

# 2. Extract problem patterns
grep "deductions" experiments/AH-001/qa/report.md | awk '{print $2}' > issues.txt

# 3. Generate fixes
node .genie/cli/agent.js chat evaluator \
  "Tune overlap_aware strategy using @issues.txt for @research.md"

# 4. Test and iterate
```

### Strategy Structure
Structure for human‑likeness strategies used by Automagik Hello:

```markdown
<identity_awareness>
# Role: Automagik Hello real‑time voice stack
# Context files to auto-load (when using Genie):
@research.md - Architecture notes
@experiments/AH-*/qa/metrics*.json - Performance baselines

# Voice optimization settings:
- Response length: natural, concise
- Interruption handling: Allow user to cut off and cancel tail
- Filler/backchannels: Use naturally ("uh‑huh", "certo", micro‑pauses)
</identity_awareness>

<discovery>
# Context gathering (reasoning_effort: medium)
<context_gathering>
- Parse user intent in < 500ms
- Maintain live partial hypotheses
- Cache frequent patterns
</context_gathering>

# Success boundaries:
✅ TTFB < 900ms consistently (P99 < 1200ms)
✅ Natural conversation flow and overlap
❌ No blocked barge‑in
❌ No robotic prosody or long dead‑air
</discovery>

<implementation>
# Concrete strategy patterns:

## Overlap‑aware rapid duplex
1. Start speaking on partial intent (≥ 0.6 conf)
2. Inject micro‑pauses every 2–4s; allow backchannels
3. Cancel tail on barge‑in; resume after 250–350ms silence
4. Keep partial flush window ≤ 120ms; chunk 120–200ms
</implementation>

<verification>
# Real‑time checks:
- Response time: log_ttfb() per turn
- Confidence: avoid speaking if ASR < 0.6 unless clarified
- Overlap: barge‑in events cancel tail within 80ms

# Post‑conversation:
- Score via @.genie/agents/evaluator.md (optional)
- Log to experiments/AH-XXX/qa/metrics.json
- Flag issues for strategy iteration
</verification>
```

---

## Security & Configuration Tips
- Set `ELEVENLABS_API_KEY` and `GROQ_API_KEY` in your environment; never commit keys.
- Optional: `EXPERIMENTAL_TTS_V3=1` to opt‑in to ElevenLabs v3 alpha.
- Sanitize PII from transcripts before sharing; prefer redacted examples.
- Keep `experiments/AH-XXX/qa/` tidy; remove empty artifacts and large binaries not needed for review.

## Commit & Pull Request Guidelines
- Commits: concise, imperative subject; reference task (e.g., `AH-001: add overlap_aware strategy`).
- PRs must include:
  - Summary, linked AH ticket/ID, scope of changes
  - Before/after metrics (snippets, paths)
  - QA evidence: transcript sample + evaluator output

## Contributor Checklist
- [ ] Follow `.claude/commands/prompt.md` structure (Discovery → Implementation → Verification) in prompts and planning.
- [ ] Use `@` includes for transcripts/metrics/research when evaluating.
- [ ] Keep TTFB targets and human‑likeness goals in scope for changes.
- [ ] Run metrics extraction (TTFB/ASR/artifacts) and attach results to PRs.
- [ ] Do not commit secrets; prefer environment variables.
