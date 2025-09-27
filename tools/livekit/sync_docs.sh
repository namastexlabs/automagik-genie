#!/usr/bin/env bash
set -euo pipefail

# Recursively download all Markdown docs from docs.livekit.io
# - Seeds: agents.md, home.md, and anything listed in llms.txt
# - Mirrors site paths under docs/livekit/all
# - Follows only links ending with .md or .html.md on docs.livekit.io

BASE="https://docs.livekit.io"
OUT_ROOT="docs/livekit/all"
QUEUE_FILE="${OUT_ROOT}/.queue"
VISITED_FILE="${OUT_ROOT}/.visited"

mkdir -p "$OUT_ROOT"
touch "$QUEUE_FILE" "$VISITED_FILE"

unique_append() {
  local list="$1"; shift
  local item
  for item in "$@"; do
    # skip empty
    [ -z "$item" ] && continue
    # normalize Windows CRLF just in case
    item="${item%$'\r'}"
    # skip anchors & queries
    item="${item%%#*}"
    item="${item%%\?*}"
    # allow items without extension; we'll try .md fallback during fetch
    # only same host if absolute URL
    if [[ "$item" =~ ^https?:// ]]; then
      if [[ ! "$item" =~ ^https?://docs\.livekit\.io(/|$) ]]; then
        continue
      fi
      item="${item#https://docs.livekit.io}"
      item="${item#http://docs.livekit.io}"
      # ensure leading slash
      [[ "$item" != /* ]] && item="/$item"
    fi
    # ensure leading slash for site-relative
    if [[ "${item}" != /* ]]; then
      # caller must pass a base dir via REL_BASE_DIR for resolving relatives
      local base_dir="${REL_BASE_DIR:-/}"
      local joined
      if [[ -z "$base_dir" ]]; then
        joined="/${item}"
      else
        joined="/${base_dir}/${item}"
      fi
      # normalize ./ and ../ segments
      # shellcheck disable=SC2001
      joined=$(echo "$joined" | sed -E 's#/\./#/#g')
      while echo "$joined" | grep -qE '/[^/]+/\.\./'; do
        joined=$(echo "$joined" | sed -E 's#/[^/]+/\.\./#/#')
      done
      item="$joined"
    fi
    # dedupe
    if ! grep -Fxq "$item" "$QUEUE_FILE" 2>/dev/null && ! grep -Fxq "$item" "$VISITED_FILE" 2>/dev/null; then
      echo "$item" >> "$QUEUE_FILE"
    fi
  done
}

fetch_and_extract() {
  local rel="$1"
  local try
  local out
  local url
  # Try path variants if extension missing or 404: as-is, +.md, +/index.md
  for try in "$rel" "${rel%.md}.md" "${rel%/}/index.md"; do
    # ensure single leading slash
    try="/${try##/}"
    url="$BASE$try"
    out="$OUT_ROOT$try"
    local out_dir
    out_dir=$(dirname "$out")
    mkdir -p "$out_dir"
    echo "[GET] $url" >&2
    if curl -fsSL "$url" -o "$out"; then
      rel="$try"
      break
    fi
  done
  if [ ! -f "$out" ]; then
    echo "[WARN] Failed to download: $BASE$rel" >&2
    return 1
  fi
  # Extract .md links from the page
  # Matches markdown links: ](path.md) and raw URLs
  local base_dir
  base_dir=$(dirname "$rel" | sed 's#^/##')
  REL_BASE_DIR="$base_dir" \
  awk '{print}' "$out" \
    | grep -Eo '\]\([^)]*\)|https?://docs\.livekit\.io/[A-Za-z0-9_./?#=-]+' \
    | sed -E 's#^\]\(([^)]*)\)$#\1#' \
    | sed -E 's#\)$##' \
    | sed -E 's#^\]\(##' \
    | while IFS= read -r link; do
        # If no extension, prefer .md
        case "$link" in
          *\.md|*\.html.md) ;; # keep
          *\#*|*\?*) ;; # ignore anchors/queries without md
          *) link="${link%/}.md" ;;
        esac
        unique_append "$QUEUE_FILE" "$link"
      done
}

# Seed with known entry points
unique_append "$QUEUE_FILE" \
  "/agents.md" \
  "/recipes.md" \
  "/home.md" \
  "/home/get-started/intro-to-livekit.md" \
  "/agents/start/voice-ai.md"

# Also seed from llms.txt if available
if curl -fsSL "$BASE/llms.txt" -o "$OUT_ROOT/llms.txt"; then
  # extract absolute and site-relative .md paths
  REL_BASE_DIR="/" \
  grep -Eo '(https?://docs\.livekit\.io/[A-Za-z0-9_./-]+\.md|/[^ ]+\.md)' "$OUT_ROOT/llms.txt" \
    | sort -u \
    | while IFS= read -r link; do
        unique_append "$QUEUE_FILE" "$link"
      done
fi

# Crawl
while true; do
  if ! read -r rel < "$QUEUE_FILE"; then
    break
  fi
  # remove from queue
  grep -Fvx "$rel" "$QUEUE_FILE" > "$QUEUE_FILE.tmp" || true
  mv "$QUEUE_FILE.tmp" "$QUEUE_FILE"
  # skip if already visited
  if grep -Fxq "$rel" "$VISITED_FILE"; then
    continue
  fi
  fetch_and_extract "$rel" || true
  echo "$rel" >> "$VISITED_FILE"
done

echo "Done. Files under $OUT_ROOT" >&2
find "$OUT_ROOT" -type f -name '*.md' | wc -l | awk '{print $1 " markdown files downloaded"}'
