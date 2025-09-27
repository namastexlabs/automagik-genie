LiveKit Docs › Self-hosting › Ingress

---

# Self-hosting the Ingress Service

> The Ingress service uses Redis messaging queues to communicate with your LiveKit server.

![Ingress service](/images/diagrams/ingress-ingress-service.svg)

## Requirements

If more than one Ingress worker is needed, the service must be setup behind a TCP load balancer (or HTTP reverse proxy for WHIP) to assign an incoming RTMP or WHIP request to an available instance. The load balancer is also responsible for TLS termination and performing Ingress node health checks.

Certain kinds of Ingress operations can be resource-intensive. We recommend giving each Ingress instance at least **4 CPUs** and **4 GB** of memory.

If WHIP support is enabled, the instance will also need access to UDP port 7885.

An Ingress worker may process one or more jobs at once, depending on their resource requirements. For example, a WHIP session with transcoding bypassed consumes minimal resources. For Ingress with transcoding enabled, such as RTMP or WHIP with transcoding bypass disabled, the amount of required resources depend on the video resolution and amount of video layers configured in the Ingress video settings.

## Config

### Ingress Service

The Ingress service takes a yaml config file:

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
prometheus_port: port used to collect Prometheus metrics. Used for autoscaling
rtmp_port: TCP port to listen for RTMP connections on (default 1935)
whip_port: TCP port to listen for WHIP connections on (default 8080)
http_relay_port: TCP port for communication between the main service process and session handler processes, on localhost (default 9090)
logging:
  level: debug, info, warn, or error (default info)
rtc_config:
  tcp_port: TCP port to use for ICE connections on (default disabled)
  udp_port: UDP port to use for ICE connections on (default 7885)
  use_external_ip: whether to use advertise the server public facing IP address for ICE connections
  # use_external_ip should be set to true for most cloud environments where
  # the host has a public IP address, but is not exposed to the process.
  # LiveKit will attempt to use STUN to discover the true IP, and convenient
  # that IP with its clients
cpu_cost:
  rtmp_cpu_cost: cpu resources to reserve when accepting RTMP sessions, in fraction of core count
  whip_cpu_cost: cpu resources to reserve when accepting WHIP sessions, in fraction of core count
  whip_bypass_transcoding_cpu_cost: cpu resources to reserve when accepting WHIP sessions with transcoding disabled, in fraction of core count

```

The location of the config file can be passed in the INGRESS_CONFIG_FILE env var, or its body can be passed in the INGRESS_CONFIG_BODY env var.

### LiveKit Server

LiveKit Server serves as the API endpoint for the CreateIngress API calls. Therefore, it needs to know the location of the Ingress service to provide the Ingress URL to clients.

To achieve this, include the following in the LiveKit Server's configuration:

```yaml
ingress:
  rtmp_base_url: 'rtmps://my.domain.com/live'
  whip_base_url: 'https://my.domain.com/whip'

```

## Health checks

The Ingress service provides HTTP endpoints for both health and availability checks. The heath check endpoint will always return a 200 status code if the Ingress service is running. The availability endpoint will only return 200 if the server load is low enough that a new request with the maximum cost, as defined in the `cpu_cost` section of the configuration file, can still be handled.

Health and availability check endpoints are exposed in 2 different ways:

- A dedicated HTTP server that can be enabled by setting the `health_port` configuration entry. The health check endpoint is running at the root of the HTTP server (`/`), while the availability endpoint is available at `/availability`
- If enabled, the WHIP server also exposes a heath check endpoint at `/health` and an availability endpoint at `/availability`

## Running natively on a host

This documents how to run the Ingress service natively on a host server. This setup is convenient for testing and development, but not advised in production.

### Prerequisites

The Ingress service can be run natively on any platform supported by GStreamer.

The Ingress service is built in Go. Go >= 1.18 is needed. The following [GStreamer](https://gstreamer.freedesktop.org/) libraries and headers must be installed:

- `gstreamer`
- `gst-plugins-base`
- `gst-plugins-good`
- `gst-plugins-bad`
- `gst-plugins-ugly`
- `gst-libav`

On MacOS, these can be installed using [Homebrew](https://brew.sh/) by running `mage bootstrap`.

In order to run Ingress against a local LiveKit server, a Redis server must be running on the host.

##### Building

Build the Ingress service by running:

```shell
mage build

```

### Configuration

All servers must be configured to communicate over localhost. Create a file named `config.yaml` with the following content:

```yaml
logging:
  level: debug
api_key: <YOUR_API_KEY>
api_secret: <YOUR_API_SECRET>
ws_url: ws://localhost:7880
redis:
  address: localhost:6379

```

### Running the service

On MacOS, if GStreamer was installed using Homebrew, the following environment must be set:

```shell
export GST_PLUGIN_PATH=/opt/homebrew/Cellar/gst-plugins-base:/opt/homebrew/Cellar/gst-plugins-good:/opt/homebrew/Cellar/gst-plugins-bad:/opt/homebrew/Cellar/gst-plugins-ugly:/opt/homebrew/Cellar/gst-plugins-bad:/opt/homebrew/Cellar/gst-libav 

```

Then to run the service:

```shell
ingress --config config.yaml

```

## Running with Docker

To run against a local LiveKit server, a Redis server must be running locally. The Ingress service must be instructed to connect to LiveKit server and Redis on the host. The host network is accessible from within the container on IP:

- host.docker.internal on MacOS and Windows
- 172.17.0.1 on linux

Create a file named `config.yaml` with the following content:

```yaml
log_level: debug
api_key: <YOUR_API_KEY>
api_secret: <YOUR_API_SECRET>
ws_url: ws://host.docker.internal:7880 (or ws://172.17.0.1:7880 on linux)
redis:
  address: host.docker.internal:6379 (or 172.17.0.1:6379 on linux)

```

In order to be able to use establish WHIP sessions over UDP, the container must be run with host networking enabled.

Then to run the service:

```shell
docker run --rm \
  -e INGRESS_CONFIG_BODY="`cat config.yaml`" \
  -p 1935:1935 \
  -p 8080:8080 \
  --network host \
  livekit/ingress

```

## Helm

If you already deployed the server using our Helm chart, jump to `helm install` below.

Ensure [Helm](https://helm.sh/docs/intro/install/) is installed on your machine.

Add the LiveKit repo

```shell
helm repo add livekit https://helm.livekit.io

```

Create a values.yaml for your deployment, using [ingress-sample.yaml](https://github.com/livekit/livekit-helm/blob/master/ingress-sample.yaml) as a template. Each instance can handle a few transcoding-enabled Ingress at a time, so be sure to either enable autoscaling, or set replicaCount accordingly.

Then install the chart

```shell
helm install <INSTANCE_NAME> livekit/ingress --namespace <NAMESPACE> --values values.yaml

```

We'll publish new version of the chart with new Ingress releases. To fetch these updates and upgrade your installation, perform

```shell
helm repo update
helm upgrade <INSTANCE_NAME> livekit/ingress --namespace <NAMESPACE> --values values.yaml

```

## Ensuring availability

An Ingress with transcoding enabled can use anywhere between 2-6 CPU cores. For this reason, it is recommended to use pods with 4 CPUs if you will be transcoding incoming media.

The `livekit_ingress_available` Prometheus metric is also provided to support autoscaling. `prometheus_port` must be defined in your config. With this metric, each instance looks at its own CPU utilization and decides whether it is available to accept incoming requests. This can be more accurate than using average CPU or memory utilization, because requests are long-running and are resource intensive.

To keep at least 3 instances available:

```
sum(livekit_ingress_available) > 3

```

To keep at least 30% of your Ingress instances available:

```
sum(livekit_ingress_available)/sum(kube_pod_labels{label_project=~"^.*ingress.*"}) > 0.3

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

To use `custom`, you'll need to install the Prometheus adapter. You can then create a Kubernetes custom metric based off the `livekit_ingress_available` Prometheus metric.

You can find an example on how to do this [here](https://towardsdatascience.com/kubernetes-hpa-with-custom-metrics-from-prometheus-9ffc201991e).

---

This document was rendered at 2025-09-27T09:36:41.423Z.
For the latest version of this document, see [https://docs.livekit.io/home/self-hosting/ingress.md](https://docs.livekit.io/home/self-hosting/ingress.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).