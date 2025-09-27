# Getting Started with Automagik Hello

This guide walks through the minimum setup required to run latency experiments and interact with the Automagik Hello research artifacts. Follow the steps in order; each section links back to the canonical references so changes stay in sync with the rest of the repo.

## 1. Prerequisites

- **Rust toolchain**: `rustup` with Rust `1.80` or newer (`rustc --version`).
  - Install components we use in CI: `rustup component add clippy rustfmt`.
- **Node.js (optional)**: Required only if you plan to run Genie CLI agents from the submodules.
- **API keys**: export the provider keys documented in [Environment Configuration](../product/environment.md). At a minimum you will need:
  - `ELEVENLABS_API_KEY`
  - `GROQ_API_KEY`
- **Tooling**: `git`, `curl`, `jq`, and `awk` for artifact downloads and quick metrics.

## 2. Clone the Repository

```bash
git clone https://github.com/<your-org>/pags-11labs-voiceagent.git
cd pags-11labs-voiceagent
git submodule update --init --recursive
```

The submodules under `vendors/` provide LiveKit and Hume reference materials used in the research docs.

## 3. Create a Local Environment File

Copy the sample below into `.env` (kept out of version control) and fill in your keys. Refer back to [Environment Configuration](../product/environment.md) for the complete list of toggles and evidence links.

```env
APP_ENV=dev
SERVER_PORT=8080
LOG_LEVEL=debug

ELEVENLABS_API_KEY=replace_me
GROQ_API_KEY=replace_me
ASR_PROVIDER=groq
TTS_MODEL_ID=eleven_flash_v2_5
ASR_MODEL_ID=whisper-large-v3-turbo

VAD_STRATEGY=webrtc
OVERLAP_POLICY=overlap_aware
CANCEL_TAIL_TIMEOUT_MS=80

EXPERIMENT_ID=AH-001
ARTIFACTS_DIR=experiments/AH-001/qa
```

Load the variables into your shell when working locally:

```bash
set -a && source .env && set +a
```

## 4. Verify Provider Connectivity

Before running any pipeline code, confirm both external services are reachable from your machine.

### ElevenLabs TTS Smoke Test

```bash
curl -sS \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  https://api.elevenlabs.io/v1/models | jq '.[].name' | head -n 5
```

You should see a list of voices or models. A 401/403 indicates the key is missing or invalid.

### Groq Whisper Availability

```bash
curl -sS \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  https://api.groq.com/openai/v1/models | jq '.data[].id' | head -n 5
```

If the request fails due to networking restrictions, stop and resolve the issue before moving on—low-latency goals depend on stable provider RTT.

## 5. Prep Experiment Artifacts (AH-001 Baseline)

We track evaluation data in `experiments/AH-001/qa/`. Populate the folder using the workflow described in [AGENTS.md](../../AGENTS.md) once you have a conversation ID from ElevenLabs:

```bash
mkdir -p experiments/AH-001/qa
curl -sS "https://api.elevenlabs.io/v1/convai/conversations/<CONV_ID>" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -o experiments/AH-001/qa/conversation.json

jq -r '.transcript' experiments/AH-001/qa/conversation.json \
  > experiments/AH-001/qa/transcript_raw.txt
```

Run the quick metrics checks (TTFB averages, ASR confidence counts) to ensure the transcript matches expectations.

## 6. Align With Latency Targets

Every doc now references the shared latency targets (200 ms P50 / 300 ms P99). Keep them in mind while you build.

- Read the [technical blueprint](../../docs/research.md) for architecture context.
- Review the [metrics definitions](../product/metrics.md) so your instrumentation matches the evaluator schema.
- Use the [roadmap](../product/roadmap.md) to see how Phase 0 and Phase 1 milestones map to gating criteria.

## 7. Next Steps (When Code Lands)

As the Rust server crates are checked in, the typical workflow will be:

1. `cargo run -p server` — start the WebSocket gateway locally.
2. Point a local client or the LiveKit POC at `ws://localhost:8080/v1/convai/conversation`.
3. Record metrics to `experiments/AH-XXX/qa/metrics.json` using the shared schema.

Those commands will be documented in `server/README.md` once the crate is published. Until then, focus on environment readiness and artifact handling.

## Troubleshooting

- **Provider 401 errors**: Double-check that your `.env` is loaded and the keys are active for API access.
- **High RTT during curl tests**: Consider VPN/region placement; review [Operational Guidance](../../docs/research.md#operational-guidance-brazil-focus).
- **Missing system packages**: Install `build-essential` (Linux) or Xcode command line tools (macOS) before running Rust builds.

## Additional Resources

- [Environment Configuration](../product/environment.md)
- [Technical Stack](../product/tech-stack.md)
- [Production Insights](../../docs/elevenlabs/production-insights.md)
- [WebSocket Protocol](../../docs/websocket-protocol.md)

Stay within these references so the documentation remains the single source of truth.
