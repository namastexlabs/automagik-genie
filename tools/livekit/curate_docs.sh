#!/usr/bin/env bash
set -euo pipefail

ROOT="docs/livekit"
ALL="$ROOT/all"

if [ ! -d "$ALL" ]; then
  echo "Missing $ALL. Run tools/livekit/sync_docs.sh first." >&2
  exit 1
fi

# Essentials allowlist (project-relevant)
cat > "$ROOT/essentials.list" << 'EOF'
agents.md
agents/start/voice-ai.md
agents/start/frontend.md
agents/start/telephony.md
agents/start/playground.md
agents/build.md
agents/build/audio.md
agents/build/events.md
agents/build/external-data.md
agents/build/metrics.md
agents/build/nodes.md
agents/build/testing.md
agents/build/text.md
agents/build/tools.md
agents/build/turns.md
agents/build/turns/turn-detector.md
agents/build/turns/vad.md
agents/build/vision.md
agents/build/workflows.md
agents/worker.md
agents/worker/agent-dispatch.md
agents/worker/job.md
agents/worker/options.md
agents/ops/deployment.md
agents/ops/deployment/cli.md
agents/ops/deployment/custom.md
agents/ops/deployment/logs.md
agents/ops/deployment/secrets.md
agents/ops/deployment/builds.md
agents/ops/recording.md
agents/integrations.md
agents/integrations/realtime.md
agents/integrations/realtime/openai.md
agents/integrations/stt.md
agents/integrations/stt/groq.md
agents/integrations/tts.md
agents/integrations/tts/elevenlabs.md
recipes.md
home/get-started/intro-to-livekit.md
home.md
EOF

# Clean curated area except all/, analysis.md, README.md (do not descend into all/)
find "$ROOT" -mindepth 1 -maxdepth 1 -type f -name '*.md' ! -name 'analysis.md' ! -name 'README.md' -delete || true
find "$ROOT" -mindepth 1 -maxdepth 1 -type d ! -name 'all' -exec rm -rf {} +

# Copy allowed files, avoiding duplicates by content hash
declare -A HASHMAP
while IFS= read -r rel; do
  [ -z "$rel" ] && continue
  src="$ALL/$rel"
  if [ ! -f "$src" ]; then
    echo "[WARN] Missing: $rel" >&2
    continue
  fi
  hash=$(sha256sum "$src" | awk '{print $1}')
  if [[ -n "${HASHMAP[$hash]:-}" ]]; then
    echo "[SKIP] Duplicate content for $rel (same as ${HASHMAP[$hash]})" >&2
    continue
  fi
  HASHMAP[$hash]="$rel"
  dst="$ROOT/$rel"
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
done < "$ROOT/essentials.list"

echo "Curated docs written under $ROOT (excluding $ALL)." >&2
