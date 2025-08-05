#!/bin/bash
# TDD Hook wrapper for Node.js project
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Use Node.js validator for this JavaScript project
node "$SCRIPT_DIR/tdd_validator.js"