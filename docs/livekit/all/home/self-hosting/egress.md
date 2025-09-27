LiveKit Docs › Self-hosting › Egress

---

# Self-hosting the Egress Service

> The Egress service uses redis messaging queues to load balance and communicate with your LiveKit server.

![Egress service](/images/diagrams/egress-egress-service.svg)

When multiple Egress workers are deployed, they will automatically load-balance and ensure requests are distributed across worker instances.

## Requirements

Certain kinds of Egress operations can be resource-intensive. We recommend giving each Egress instance at least **4 CPUs** and **4 GB** of memory.

An Egress worker may process one or more jobs at once, depending on their resource requirements. For example, a TrackEgress job consumes minimal resources because it doesn't need to transcode. Consequently, hundreds of simulteneous TrackEgress jobs can run on a single instance.

> ℹ️ **Note**
> 
> As of **v1.7.6**, chrome sandboxing is enabled for increased security. As a result, the service is no longer run as the `root` user inside docker, and all Egress deployments (even local) require `--cap-add=SYS_ADMIN` in your `docker run` command. Without it, all web and room composite egress will fail with a `chrome failed to start` error.

## Config

The Egress service takes a yaml config file:

```yaml
# Required fields
api_key: livekit server api key. LIVEKIT_API_KEY env can be used instead
api_secret: livekit server api secret. LIVEKIT_API_SECRET env can be used instead
ws_url: livekit server websocket url. LIVEKIT_WS_URL can be used instead
redis:
  address: must be the same redis address used by your livekit server
  username: redis username
  password: redis password
  db: redis db

# Optional fields
health_port: if used, will open an http port for health checks
template_port: port used to host default templates (default 7980)
prometheus_port: port used to collect prometheus metrics. Used for autoscaling
log_level: debug, info, warn, or error (default info)
template_base: can be used to host custom templates (default http://localhost:<template_port>/)
enable_chrome_sandbox: if true, egress will run Chrome with sandboxing enabled. This requires a specific Docker setup, see below.
insecure: can be used to connect to an insecure websocket (default false)

# File upload config - only one of the following. Can be overridden per-request
s3:
  access_key: AWS_ACCESS_KEY_ID env can be used instead
  secret: AWS_SECRET_ACCESS_KEY env can be used instead
  region: AWS_DEFAULT_REGION env can be used instead
  endpoint: optional custom endpoint
  bucket: bucket to upload files to
azure:
  account_name: AZURE_STORAGE_ACCOUNT env can be used instead
  account_key: AZURE_STORAGE_KEY env can be used instead
  container_name: container to upload files to
gcp:
  credentials_json: GOOGLE_APPLICATION_CREDENTIALS env can be used instead
  bucket: bucket to upload files to

```

The config file can be added to a mounted volume with its location passed in the EGRESS_CONFIG_FILE env var, or its body can be passed in the EGRESS_CONFIG_BODY env var.

## Running locally

These changes are **not** recommended for a production setup.

To run against a local livekit server, you'll need to do the following:

- open `/usr/local/etc/redis.conf` and comment out the line that says `bind 127.0.0.1`
- change `protected-mode yes` to `protected-mode no` in the same file
- find your IP as seen by docker
- `ws_url` needs to be set using the IP as Docker sees it
- on linux, this should be `172.17.0.1`
- on mac or windows, run `docker run -it --rm alpine nslookup host.docker.internal` and you should see something like `Name:	host.docker.internal Address: 192.168.65.2`

These changes allow the service to connect to your local redis instance from inside the docker container.

Create a directory to mount. In this example, we will use `~/livekit-egress`.

Create a config.yaml in the above directory.

- `redis` and `ws_url` should use the above IP instead of `localhost`
- `insecure` should be set to true

```yaml
log_level: debug
api_key: your-api-key
api_secret: your-api-secret
ws_url: ws://192.168.65.2:7880
insecure: true
redis:
  address: 192.168.65.2:6379

```

Then to run the service:

```shell
docker run --rm \
  --cap-add SYS_ADMIN \
  -e EGRESS_CONFIG_FILE=/out/config.yaml \
  -v ~/livekit-egress:/out \
  livekit/egress

```

You can then use our [CLI](https://github.com/livekit/livekit-cli) to submit recording requests to your server.

## Helm

If you already deployed the server using our Helm chart, jump to `helm install` below.

Ensure [Helm](https://helm.sh/docs/intro/install/) is installed on your machine.

Add the LiveKit repo

```shell
helm repo add livekit https://helm.livekit.io

```

Create a values.yaml for your deployment, using [egress-sample.yaml](https://github.com/livekit/livekit-helm/blob/master/egress-sample.yaml) as a template. Each instance can record one room at a time, so be sure to either enable autoscaling, or set replicaCount >= the number of rooms you'll need to simultaneously record.

Then install the chart

```shell
helm install <INSTANCE_NAME> livekit/egress --namespace <NAMESPACE> --values values.yaml

```

We'll publish new version of the chart with new egress releases. To fetch these updates and upgrade your installation, perform

```shell
helm repo update
helm upgrade <INSTANCE_NAME> livekit/egress --namespace <NAMESPACE> --values values.yaml

```

## Ensuring availability

Room Composite egress can use anywhere between 2-6 CPUs. For this reason, it is recommended to use pods with 4 CPUs if you will be using room composite egress.

The `livekit_egress_available` Prometheus metric is also provided to support autoscaling. `prometheus_port` must be defined in your config. With this metric, each instance looks at its own CPU utilization and decides whether it is available to accept incoming requests. This can be more accurate than using average CPU or memory utilization, because requests are long-running and are resource intensive.

To keep at least 3 instances available:

```
sum(livekit_egress_available) > 3

```

To keep at least 30% of your egress instances available:

```
sum(livekit_egress_available)/sum(kube_pod_labels{label_project=~"^.*egress.*"}) > 0.3

```

### Autoscaling with Helm

There are 3 options for autoscaling: `targetCPUUtilizationPercentage`, `targetMemoryUtilizationPercentage`, and `custom`.

```yaml
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 5
#  targetCPUUtilizationPercentage: 60
#  targetMemoryUtilizationPercentage: 60
#  custom:
#    metricName: my_metric_name
#    targetAverageValue: 70

```

To use `custom`, you'll need to install the prometheus adapter. You can then create a kubernetes custom metric based off the `livekit_egress_available` prometheus metric.

## Chrome sandboxing

By default, Room Composite and Web egresses run with Chrome sandboxing disabled. This is because the default docker security settings prevent Chrome from switching to a different kernel namespace, which is needed by Chrome to setup its sandbox.

Chrome sandboxing within Egress can be reenabled by setting the `enable_chrome_sandbox` option to `true` in the egress configuration, and launching docker using the [provided seccomp security profile](https://github.com/livekit/egress/blob/main/chrome-sandboxing-seccomp-profile.json):

```shell
docker run --rm \
  -e EGRESS_CONFIG_FILE=/out/config.yaml \
  -v ~/egress-test:/out \
  --security-opt seccomp=chrome-sandboxing-seccomp-profile.json \
  livekit/egress

```

This profile is based on the [default docker seccomp security profile](https://github.com/moby/moby/blob/master/profiles/seccomp/default.json) and allows the 2 extra system calls (`clone` and `unshare`) that Chrome needs to setup the sandbox.

Note that kubernetes disables seccomp entirely by default, which means that running with Chrome sandboxing enabled is possible on a kubernetes cluster with the default security settings.

---

This document was rendered at 2025-09-27T09:36:41.153Z.
For the latest version of this document, see [https://docs.livekit.io/home/self-hosting/egress.md](https://docs.livekit.io/home/self-hosting/egress.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).