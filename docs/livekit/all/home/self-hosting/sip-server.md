LiveKit Docs › Self-hosting › SIP server

---

# Self-hosted SIP server

> Setting up and configuring a self-hosted SIP server for LiveKit telephony apps.

> 🔥 **Caution**
> 
> Both SIP signaling port (`5060`) and media port range (`10000-20000`) must be accessible from the Internet. See [Firewall configuration](https://docs.livekit.io/home/self-hosting/ports-firewall.md) for details.

## Docker compose

The easiest way to run SIP Server is by using Docker Compose:

```shell
wget https://raw.githubusercontent.com/livekit/sip/main/docker-compose.yaml
docker compose up

```

This starts a local LiveKit Server and SIP Server connected to Redis.

## Running natively

You may also run SIP server natively without Docker.

### 1. Install SIP server

Follow instructions [here](https://github.com/livekit/sip/#running-locally).

### 2. Create config file

Create a file named `config.yaml` with the following content:

```yaml
api_key: <your-api-key>
api_secret: <your-api-secret>
ws_url: ws://localhost:7880
redis:
  address: localhost:6379
sip_port: 5060
rtp_port: 10000-20000
use_external_ip: true
logging:
  level: debug

```

### 3. Run SIP server:

```shell
livekit-sip --config=config.yaml

```

### 4. Determine your SIP URI

Once your SIP server is running, you would have to determine the publilc IP address of the machine.

Then your SIP URI would be:

```
<public-ip-address>:5060

```

---

This document was rendered at 2025-09-27T09:36:42.529Z.
For the latest version of this document, see [https://docs.livekit.io/home/self-hosting/sip-server.md](https://docs.livekit.io/home/self-hosting/sip-server.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).