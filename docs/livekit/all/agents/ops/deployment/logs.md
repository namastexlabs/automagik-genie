LiveKit Docs › Deployment & operations › Deploying to LiveKit Cloud › Log collection

---

# Log collection

> Monitor and debug your deployed agents with comprehensive logging.

## Overview

LiveKit Cloud provides realtime logging for your deployed agents, helping you monitor performance, debug issues, and understand your agent's behavior in production. Logs are collected from all phases of your agent's lifecycle—from build to runtime—and can be forwarded to external monitoring services such as [Datadog](https://www.datadoghq.com/), [CloudWatch](https://aws.amazon.com/cloudwatch/), [Sentry](https://sentry.io/), and [New Relic](https://newrelic.com/). You can also view some logs with the LiveKit CLI. LiveKit Cloud does not store runtime logs.

## Log types

LiveKit Cloud collects two types of logs for your agents:

- **Runtime logs**: Your agent's app logs, including stdout, stderr, and any other [logging](https://docs.livekit.io/agents/build/metrics.md) you implement.
- **Build logs**: Output from the container build process, including Dockerfile execution and dependency installation.

## Follow runtime logs

Use the LiveKit CLI to follow logs from your deployed agents in realtime.

```bash
lk agent logs

```

This command continuously streams logs from the latest running instance of your agent. It also includes a short snapshot of recent logs.

> ℹ️ **Single instance**
> 
> The LiveKit CLI only shows logs from the newest worker instance of your agent, which can include multiple jobs. All logs from this worker are included, but it is not a comprehensive view of all logs from all instances for agents running at scale. To collect logs from all instances, use an external logging service by using the [Forward runtime logs](#forward-runtime-logs) feature.

## View build logs

Use the LiveKit CLI to view the Docker build logs from the currently deployed version of your agent.

```bash
lk agent logs --log-type=build

```

This command prints the logs to stdout, but does not perform a live tail.

Build logs from more versions of your agent are available in the [LiveKit Cloud dashboard](https://cloud.livekit.io/projects/p_/agents).

## Forward runtime logs

Forward your agent logs to external monitoring services for long-term storage, advanced analytics, and integration with your existing observability stack.

The currently supported destinations are Datadog, CloudWatch, Sentry, and New Relic.

### Datadog integration

Add a [Datadog](https://docs.livekit.io/agents/ops/deployment/secrets.md) client token as a [secret](https://docs.livekit.io/agents/ops/deployment/secrets.md) to automatically enable log forwarding. If your account is in a region other than `us1`, you can also set the region. All runtime logs are automatically forwarded to your Datadog account.

```bash
lk agent update-secrets --secrets "DATADOG_TOKEN=your-client-token"

```

- **`DATADOG_TOKEN`** _(string)_: Your Datadog [client token](https://docs.datadoghq.com/account_management/api-app-keys/#client-tokens).

- **`DATADOG_REGION`** _(string)_ (optional) - Default: `us1`: Your Datadog region. Supported regions are `us1`, `us3`, `us5`, `us1-fed`, `eu`, and `ap1`.

#### Log fields

The following log fields are set in Datadog for all log lines sent from LiveKit Cloud:

| Field | Value | Description |
| host | <worker-id> | A unique identifier for the specific worker instance emitting the log. |
| source | <agent-id> | The ID of the agent, as in `livekit.toml` and the dashboard, |
| service | `"cloud.livekit.io"` |  |
| stream | `stdout` or `stderr` | Indicates whether the log originated from stdout or stderr. |

### CloudWatch integration

Add a [CloudWatch](https://docs.livekit.io/agents/ops/deployment/secrets.md) `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as [secrets](https://docs.livekit.io/agents/ops/deployment/secrets.md) to automatically enable log forwarding. The AWS region defaults to `us-west-2`, you can set it by setting the `AWS_REGION` secret. All runtime logs are automatically forwarded to your CloudWatch account.

```bash
lk agent update-secrets --secrets "AWS_ACCESS_KEY_ID=your-access-key-id" --secrets "AWS_SECRET_ACCESS_KEY=your-secret-access-key"

```

- **`AWS_ACCESS_KEY_ID`** _(string)_: Your AWS [access key ID](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html).

- **`AWS_SECRET_ACCESS_KEY`** _(string)_: Your AWS [secret access key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html).

- **`AWS_REGION`** _(string)_ (optional) - Default: `us-west-2`: Your AWS region. See the [AWS regions](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html) page for a list of all supported regions.

### Sentry integration

Add a [Sentry](https://docs.livekit.io/agents/ops/deployment/secrets.md) `SENTRY_DSN` as a [secret](https://docs.livekit.io/agents/ops/deployment/secrets.md) to automatically enable log forwarding. All runtime logs are automatically forwarded to your Sentry account.

```bash
lk agent update-secrets --secrets "SENTRY_DSN=your-sentry-dsn"

```

- **`SENTRY_DSN`** _(string)_: Your Sentry [DSN](https://docs.sentry.io/product/sentry-basics/dsn-explainer/).

### New Relic integration

Add a [New Relic](https://docs.livekit.io/agents/ops/deployment/secrets.md) `NEW_RELIC_LICENSE_KEY` as a [secret](https://docs.livekit.io/agents/ops/deployment/secrets.md) to automatically enable log forwarding. All runtime logs are automatically forwarded to your New Relic account.

```bash
lk agent update-secrets --secrets "NEW_RELIC_LICENSE_KEY=your-license-key"

```

- **`NEW_RELIC_LICENSE_KEY`** _(string)_: Your New Relic [license key](https://docs.newrelic.com/docs/accounts/accounts-billing/account-setup/license-key-faq/).

## Log levels

Your agent worker configuration determines the log levels that are collected and forwarded. The default log level is `INFO`. To use a different value, set the log level in your Dockerfile:

```dockerfile
CMD ["python", "agent.py", "start", "--log-level=DEBUG"]

```

For more information on log levels, see the [worker options](https://docs.livekit.io/agents/worker/options.md#log-levels) page.

## Log retention

LiveKit Cloud does not store runtime logs. Build logs are stored indefinitely for the most recently deployed version.

## Additional resources

The following resources may be helpful to design a logging strategy for your agent:

- **[Logs, metrics, and telemetry](https://docs.livekit.io/agents/build/metrics.md)**: Guide to collecting logs, metrics, and telemetry data from your agent.

- **[Worker options](https://docs.livekit.io/agents/worker/options.md)**: Learn how to configure your agent worker.

- **[Secrets management](https://docs.livekit.io/agents/ops/deployment/secrets.md)**: Learn how to securely manage API keys for log forwarding.

- **[Agents CLI reference](https://docs.livekit.io/agents/ops/deployment/cli.md)**: Reference for the agent deployment commands in the LiveKit CLI.

---

This document was rendered at 2025-09-27T09:36:20.881Z.
For the latest version of this document, see [https://docs.livekit.io/agents/ops/deployment/logs.md](https://docs.livekit.io/agents/ops/deployment/logs.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).