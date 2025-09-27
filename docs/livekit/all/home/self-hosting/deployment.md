LiveKit Docs › Self-hosting › Deployment overview

---

# Deploying LiveKit

> WebRTC servers can be tricky to deploy because of their use of UDP ports and having to know their own public IP address. This guide will help you get a secure LiveKit deployment up and running.

## Domain, SSL certificates, and load balancer

In order to have a secure LiveKit deployment, you will need a domain as well as a SSL certificate for that domain. This domain will be used as the primary endpoint for LiveKit SDKs, for example: `wss://livekit.yourhost.com`. The SSL certificate must be signed by a trusted certificate authority; self-signed certs do not work here.

You will also need to set up HTTPS/SSL termination with a load balancer or reverse proxy.

If you are using TURN, then a separate TURN domain and SSL cert will be needed, as well.

## Improving connectivity with TURN

Certain corporate firewalls block not only UDP traffic, but non-secure TCP traffic, as well. In those cases, it's helpful to use a TURN server. [Here's](https://bloggeek.me/webrtc-turn/) a good resource if you're interested in reading more about how TURN is used.

The good news is LiveKit includes an embedded TURN server. It's a secure TURN implementation that has integrated authentication with the rest of LiveKit. The authentication layer ensures that only clients that have already established a signal connection could connect to our TURN server.

### TURN/TLS

To firewalls, TLS traffic looks no different from regular HTTPS traffic to websites. Enabling TURN/TLS gives you the broadest coverage in client connectivity, including those behind corporate firewalls. TURN/TLS can be enabled with:

```yaml
turn:
  enabled: true
  tls_port: 5349
  domain: turn.myhost.com
  cert_file: /path/to/turn.crt
  key_file: /path/to/turn.key

```

LiveKit will perform TLS termination, so you will have to specify the certificates in the config. When running multiple LiveKit instances, you can place a layer 4 load balancer in front of the TCP port.

If you are not using a load balancer, `turn.tls_port` needs to be set to 443, as that will be the port that's advertised to clients.

### TURN/UDP

As QUIC (HTTP/3) gains adoption, some firewalls started allowing UDP traffic to pass through port 443. In those cases, it helps to use TURN/UDP on port 443. UDP is preferred over TCP for WebRTC traffic, as it has better control over congestion and latency. TURN/UDP can be enabled with:

```yaml
turn:
  enabled: true
  udp_port: 443

```

## Configuration

For production deploys, we recommend using a config file. The config file can be passed in via `--config` flag, or the body of the YAML can be set with a `LIVEKIT_CONFIG` environment variable.

Below is a recommended config for a production deploy. To view other customization options, see [config-sample.yaml](https://github.com/livekit/livekit/blob/master/config-sample.yaml)

```yaml
port: 7880
log_level: info
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  # use_external_ip should be set to true for most cloud environments where
  # the host has a public IP address, but is not exposed to the process.
  # LiveKit will attempt to use STUN to discover the true IP, and advertise
  # that IP with its clients
  use_external_ip: true
redis:
  # redis is recommended for production deploys
  address: my-redis-server.name:6379
keys:
  # key-value pairs
  # your_api_key: <your_api_secret>
# When enabled, LiveKit will expose prometheus metrics on :6789/metrics
#prometheus_port: 6789
turn:
  enabled: true
  # domain must match tls certificate
  domain: <turn.myhost.com>
  # defaults to 3478. If not using a load balancer, must be set to 443.
  tls_port: 3478

```

## Resources

The scalability of LiveKit is bound by CPU and bandwidth. We recommend running production setups on 10Gbps ethernet or faster.

When deploying to cloud providers, compute-optimized instance types are the most suitable for LiveKit.

If running in a Dockerized environment, host networking should be used for optimal performance.

---

This document was rendered at 2025-09-27T09:36:40.613Z.
For the latest version of this document, see [https://docs.livekit.io/home/self-hosting/deployment.md](https://docs.livekit.io/home/self-hosting/deployment.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).