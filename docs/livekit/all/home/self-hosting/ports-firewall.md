LiveKit Docs › Self-hosting › Firewall configuration

---

# Ports and firewall

> Reference for ports and suggested firewall rules for LiveKit.

## Ports

LiveKit uses several ports to communicate with clients. Exposed ports below need to be open on the firewall.

| Port | Default | Config | Exposed | Description |
| API, WebSocket | 7880 | `port` | no | This port should be placed behind a load balancer that can terminate SSL. LiveKit APIs are homogenous: any client could connect to any backend instance, regardless of the room they are in. |
| ICE/UDP | 50000-60000 | `rtc.port_range_start`, `rtc.port_range_end` | yes | LiveKit advertises these ports as WebRTC host candidates (each participant in the room will use two ports) |
| ICE/TCP | 7881 | `rtc.tcp_port` | yes | Used when the client could not connect via UDP (e.g. VPN, corporate firewalls) |
| ICE/UDP Mux | 7882 | `rtc.udp_port` | yes | (optional) It's possible to handle all UDP traffic on a single port. When this is set, rtc.port_range_start/end are not used |
| TURN/TLS | 5349 | `turn.tls_port` | when not using LB | (optional) For a distributed setup, use a network load balancer in front of the port. If not using LB, this port needs to be set to 443. |
| TURN/UDP | 3478 | `turn.udp_port` | yes | (optional) To use the embedded TURN/UDP server. When enabled, it also serves as a STUN server. |
| SIP/UDP | 5060 | `sip_port` | yes | (optional) UDP signaling port for LiveKit SIP. Available in  `sip/config.yml`. |
| SIP/TCP | 5060 | `sip_port` | yes | (optional) TCP signaling port for LiveKit SIP. Available in  `sip/config.yml`. |
| SIP/TLS | 5061 | `tls.port` | yes | (optional) TLS signaling port for LiveKit SIP. Available in  `sip/config.yml`. |
| SIP RTP/UDP | 10000-20000 | `rtp_port` | yes | (optional) RTP media port range for LiveKit SIP. Available in  `sip/config.yml`. |

## Firewall

When hosting in cloud environments, the ports configured above will have to be opened in the firewall.

**AWS**:

Navigate to the VPC dashboard, choose `Security Groups`, and select the security group that LiveKit is deployed to. Open the `Inbound rules` tab and select `Edit Inbound Rules`

![AWS inbound rules](/images/deploy/aws-inbound-rules.png)

Then add the following rules (assuming use of default ports):

![AWS add rules](/images/deploy/aws-inbound-rules-2.png)

---

**Digital Ocean**:

By default, Droplets are not placed behind a firewall, as long as they have a public IP address.

If using a firewall, ensure the inbound rules are edited to match the required ports

![Digital Ocean firewall](/images/deploy/do-firewall-rules.png)

---

**Google Cloud**:

Navigate to VPC network, then select `Firewall` on the left. Then select `Create Firewall Rule` in the top menu.

The firewall rule should look something like this:

![Google Cloud firewall rules](/images/deploy/gcloud-firewall-rules.png)

---

This document was rendered at 2025-09-27T09:36:42.262Z.
For the latest version of this document, see [https://docs.livekit.io/home/self-hosting/ports-firewall.md](https://docs.livekit.io/home/self-hosting/ports-firewall.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).