# Environment Configuration (Template)

This template provides common environment variable patterns. Customize for your {{PROJECT_NAME}} and {{DOMAIN}}.

## Conventions
- Names: UPPER_SNAKE_CASE
- Types: string | int (ms) | bool (`0/1` or `true/false`)
- Scope: [required], [optional], [experimental]

## Core Application
- APP_NAME [optional]: default `{{PROJECT_NAME}}`
- APP_ENV [optional]: `dev|staging|prod` (default `dev`)
- SERVER_HOST [optional]: default `0.0.0.0`
- SERVER_PORT [optional]: default `8080`
- LOG_LEVEL [optional]: `trace|debug|info|warn|error` (default `info`)
- LOG_FORMAT [optional]: `json|pretty` (default `json`)

## Genie Configuration
- GENIE_CLI_STYLE [optional]: `plain|compact|art` (default `compact`)
- GENIE_DEFAULT_PRESET [optional]: agent preset name
- GENIE_BACKGROUND_DEFAULT [optional]: `0|1` (default `1`)

## Provider Configuration (examples)
- {{PROVIDER}}_API_KEY [required]: API key for your provider
- {{PROVIDER}}_ENDPOINT [optional]: Override endpoint
- {{PROVIDER}}_REGION [optional]: Regional endpoint

## Feature Flags (examples)
- FEATURE_{{NAME}} [optional]: `0|1` (default `0`)
- ENABLE_{{CAPABILITY}} [optional]: `0|1` (default `0`)

## Wishes & Artifacts
- WISH_SLUG [optional]: e.g., `initial-setup`
- ARTIFACTS_DIR [optional]: default `.genie/wishes/${WISH_SLUG}/evidence`

## Limits & Safety
- MAX_CONCURRENT_AGENTS [optional]: default `10`
- SESSION_TIMEOUT_SECONDS [optional]: default `3600`
- RATE_LIMIT_RPS [optional]: default `100`

## Example .env (development)
```env
APP_ENV=dev
SERVER_PORT=8080
LOG_LEVEL=debug

{{PROVIDER}}_API_KEY=your_key_here
WISH_SLUG=onboarding-genie
ARTIFACTS_DIR=.genie/wishes/onboarding-genie/evidence

# Genie CLI
GENIE_CLI_STYLE=compact
GENIE_DEFAULT_PRESET=careful
```

## Notes
- Keep defaults conservative; prefer opt-in for experimental features
- Document project-specific variables in your own docs
- Never commit real API keys or secrets