LiveKit Docs › LiveKit CLI › Project management

---

# LiveKit CLI project management

> Add, list, and manage projects in the LiveKit CLI.

## Overview

Use the `lk project` commands to manage LiveKit projects used by the CLI. A project is a composed of a URL, API key, and API secret that point to a LiveKit deployment, plus a name to reference the project in the CLI. You can set a default project that is used by other commands when no project is specified.

For instructions to install the CLI, see the LiveKit CLI [Getting started](https://docs.livekit.io/home/cli.md) guide.

```bash
lk project [command [command options]]

```

## LiveKit Cloud projects

Use the `lk cloud` command to authenticate with LiveKit Cloud and link your Cloud-hosted projects to the CLI. LiveKit Cloud automatically generates a new API key for your CLI instance and performs a [project add](#add) for you.

```bash
lk cloud [command [command options]]

```

### Auth

Authenticate a LiveKit Cloud account to link a single project. The command opens a browser-based flow to sign in to LiveKit Cloud and select a single project. To link multiple projects, run this command multiple times.

```bash
lk cloud auth [options]

```

Options for `cloud auth`:

- `--timeout SECONDS, -t SECONDS`: Number of seconds to attempt authentication before giving up. Default: `900`.
- `--poll-interval SECONDS, -i SECONDS`: Number of seconds between poll requests while waiting. Default: `4`.

#### Examples

Link your LiveKit Cloud account and import a project.

```bash
lk cloud auth

```

### Revoke

Revoke an authorization for an existing project. This revokes the API keys that were issued with `lk cloud auth`, and then performs a [project remove](#remove) for you.

```bash
lk cloud auth --revoke

```

Options for `cloud auth --revoke`:

- `--project PROJECT_NAME`: Name of the project to revoke. Default: default project.

> ⚠️ **Warning**
> 
> Revoking an authorization also revokes the API keys stored in your CLI instance. Any copies of these keys previously made with `lk app env` or `lk app create` are also revoked.

## Project subcommands

The following project subcommands are available:

### Add

Add a new project to your CLI instance.

For LiveKit Cloud projects, use the [cloud auth](#cloud-auth) command to link your account and import projects through your browser.

```bash
lk project add PROJECT_NAME --url LIVEKIT_URL --api-key API_KEY --api-secret API_SECRET [--default]

```

Options for `add`:

- `PROJECT_NAME`: Name of the project. Must be unique in your CLI instance.
- `--url URL`: websocket URL of the LiveKit server.
- `--api-key KEY`: Project API key.
- `--api-secret SECRET`: Project API secret.
- `--default`: Set this project as the default. Default: `false`.

#### Examples

Add a self-hosted project and set it as default:

```bash
lk project add my-project \
  --url http://localhost:7880 \
  --api-key <my-api-key> \
  --api-secret <my-api-secret> \
  --default

```

### List

List all configured projects.

```bash
lk project list [options]

```

Options for `list`:

- `--json, -j`: Output as JSON, including API key and secret. Default: `false`.

#### Examples

Human-readable output (current default is marked with `*`):

```bash
lk project list

```

Example output:

```bash
┌──────────────────────┬──────────────────────────────────────────────────┬───────────────┐
│ Name                 │ URL                                              │ API Key       │
├──────────────────────┼──────────────────────────────────────────────────┼───────────────┤
│   dev-local          │ http://localhost:7880                            │ APIxxxxxxxxxx │
│   staging            │ wss://staging-abc123.livekit.cloud               │ APIyyyyyyyyyy │
│ * production         │ wss://production-xyz789.livekit.cloud            │ APIzzzzzzzzzz │
└──────────────────────┴──────────────────────────────────────────────────┴───────────────┘

```

JSON output:

```bash
lk project list --json

```

Example output:

```json
[
  {
    "Name": "dev-local",
    "URL": "http://localhost:7880",
    "APIKey": "APIxxxxxxxxxx",
    "APISecret": "abc123"
  },
  {
    "Name": "staging",
    "URL": "wss://staging-abc123.livekit.cloud",
    "APIKey": "APIyyyyyyyyyy",
    "APISecret": "abc123"
  },
  {
    "Name": "production",
    "URL": "wss://production-xyz789.livekit.cloud",
    "APIKey": "APIzzzzzzzzzz",
    "APISecret": "abc123"
  }
]

```

### Remove

Remove an existing project from your local CLI configuration. This does not affect the project in LiveKit Cloud.

For LiveKit Cloud projects, use the [cloud auth revoke](#cloud-auth-revoke) command to revoke the API keys and remove the project from the CLI.

```bash
lk project remove PROJECT_NAME

```

#### Examples

```bash
lk project remove dev-local

```

### Set-default

Set a project as the default to use with other commands.

```bash
lk project set-default PROJECT_NAME

```

#### Examples

```bash
lk project set-default production

```

List projects to see the current default, change it, then list again:

```bash
lk project list

```

Example output:

```bash
┌──────────────────────┬──────────────────────────────────────────────────┬───────────────┐
│ Name                 │ URL                                              │ API Key       │
├──────────────────────┼──────────────────────────────────────────────────┼───────────────┤
│   dev-local          │ http://localhost:7880                            │ APIxxxxxxxxxx │
│ * staging            │ wss://staging-abc123.livekit.cloud               │ APIyyyyyyyyyy │
│   production         │ wss://production-xyz789.livekit.cloud            │ APIzzzzzzzzzz │
└──────────────────────┴──────────────────────────────────────────────────┴───────────────┘

```

Change the default to `production`:

```bash
lk project set-default production

```

List again to confirm the change:

```bash
lk project list

```

Example output:

```bash
┌──────────────────────┬──────────────────────────────────────────────────┬───────────────┐
│ Name                 │ URL                                              │ API Key       │
├──────────────────────┼──────────────────────────────────────────────────┼───────────────┤
│   dev-local          │ http://localhost:7880                            │ APIxxxxxxxxxx │
│   staging            │ wss://staging-abc123.livekit.cloud               │ APIyyyyyyyyyy │
│ * production         │ wss://production-xyz789.livekit.cloud            │ APIzzzzzzzzzz │
└──────────────────────┴──────────────────────────────────────────────────┴───────────────┘

```

---

This document was rendered at 2025-09-27T09:36:24.867Z.
For the latest version of this document, see [https://docs.livekit.io/home/cli/projects.md](https://docs.livekit.io/home/cli/projects.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).