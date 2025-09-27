LiveKit Docs › Self-hosting › Virtual machine

---

# Deploy to a VM

> This guide helps you to set up a production-ready LiveKit server on a cloud virtual machine.

This configuration utilizes Docker Compose and Caddy. Your LiveKit server will support a broad spectrum of connectivity options, including those behind VPN and firewalls (via TURN/TLS)

You do not need separate SSL certificates for this set up, we will provision them automatically with Caddy. (by using Let's Encrypt or ZeroSSL)

If desired, the generator can also assist with setting up LiveKit [Ingress](https://docs.livekit.io/home/ingress/overview.md) and [Egress](https://docs.livekit.io/home/egress/overview.md). This gives you the ability to ingest media from other sources, as well as enabling recording capabilities.

## Pre-requisites

To start, you'll need:

- A domain that you own
- The ability to add DNS records for subdomains for your new LiveKit server

## Generate configuration

Use our configuration generation tool to create a customized configuration for your domain. This script should be run on your development machine:

```shell
docker pull livekit/generate
docker run --rm -it -v$PWD:/output livekit/generate

```

It creates a folder with the name of domain you provided, containing the following files:

- `caddy.yaml`
- `docker-compose.yaml`
- `livekit.yaml`
- `redis.conf`
- `init_script.sh` OR `cloud_init.xxxx.yaml`

## Deploy to a VM

Depending on your cloud provider, there are a couple of options:

**Cloud Init**:

This is the easiest method for deploying LiveKit Server. AWS, Azure, Digital Ocean, and others support [cloud-init](https://cloud-init.io/).

We have tested our scripts on Ubuntu and Amazon Linux, but it's possible the same scripts may work on other platforms. (Please let us know in Slack or open a PR!)

When starting a VM, paste the contents of the file `cloud-init.xxxx.yaml` into the `User data` field.

That's it! When the machine starts up, it'll execute the cloud-init protocol and install LiveKit.

---

**Startup Script**:

We can also generate a startup script which may be copied onto any Linux VM.

This has been tested with Linode and Google Cloud.

1. Start a VM as usual
2. Copy the file `init_script.sh` to the VM
3. ssh into the instance
4. Run `sudo ./init_script.sh` to perform installation

When the install script is finished, your instance should be set up. It will have installed:

- `docker`
- `docker-compose`
- generated configuration to `/opt/livekit`
- systemd service `livekit-docker`

To start/stop the service via systemctl:

```shell
systemctl stop livekit-docker

systemctl start livekit-docker

```

## Firewall

Ensure that the following ports are open on your firewall and accessible on the instance:

- `443` - primary HTTPS and TURN/TLS
- `80` - TLS issuance
- `7881` - WebRTC over TCP
- `3478/UDP` - TURN/UDP
- `50000-60000/UDP` - WebRTC over UDP

And if Ingress is desired

- `1935` - RTMP Ingress
- `7885/UDP` - WebRTC for WHIP Ingress

## DNS

Both primary and TURN domains must point to the IP address of your instance.

This is required for Caddy to start provisioning your TLS certificates.

## Upgrading

To upgrade your install to new LiveKit releases, edit the docker compose file: `/opt/livekit/docker-compose.yaml`

Change the image field under `livekit` to `livekit/livekit-server:v<version>`

Alternatively, to always run the latest version, set the image field to `livekit/livekit-server:latest` and run:

```shell
docker pull livekit/livekit-server

```

## Troubleshooting

If something is not working as expected, SSH in to your server and use the following commands to investigate:

```shell
systemctl status livekit-docker
cd /opt/livekit
sudo docker-compose logs

```

### Checking TLS certificates

If certificate acquisition process has been successful, you should see the following log entry:

```shell
livekit-caddy-1    | {"level":"info","ts":1642786068.3883107,"logger":"tls.obtain","msg":"certificate obtained successfully","identifier":"<yourhost>"}

```

If you don't see these messages, it means your server could not be reached from the internet.

### Ensure DNS is pointed at your domain

Running `host <yourdomain>` should show the IP address of your server. Ensure that it matches the IP address of your server.

### Instance started before networking

When using cloud-init, it's possible that the instance started up before networking was available to the machine. This is commonly the case on EC2 instances. When this happens, your cloud-init scripts will be stuck in a bad state. To fix this, you can SSH into the machine and trigger a re-run:

```shell
sudo cloud-init clean --logs
sudo reboot now

```

### Instance firewall

Certain Linux distributions ship with an instance-specific firewall enabled. To check if this is the case, run:

```shell
sudo firewall-cmd --list-all

```

If firewall is enabled, you could add the following rules to it and restart the firewall:

```shell
sudo firewall-cmd --zone public --permanent --add-port 80/tcp
sudo firewall-cmd --zone public --permanent --add-port 443/tcp
sudo firewall-cmd --zone public --permanent --add-port 7881/tcp
sudo firewall-cmd --zone public --permanent --add-port 443/udp
sudo firewall-cmd --zone public --permanent --add-port 50000-60000/udp
sudo firewall-cmd --reload

```

When the ports are successfully opened, running `curl http://<yourdomain>` should return a 404 response. (instead of hanging)

---

This document was rendered at 2025-09-27T09:36:42.822Z.
For the latest version of this document, see [https://docs.livekit.io/home/self-hosting/vm.md](https://docs.livekit.io/home/self-hosting/vm.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).