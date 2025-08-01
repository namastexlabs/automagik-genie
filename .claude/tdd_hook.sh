#!/bin/bash
# TDD Hook wrapper that uses uv run
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"
uv run python "$SCRIPT_DIR/tdd_validator.py"