LiveKit Docs › LiveKit Cloud › Configuring firewalls

---

# Configuring firewalls

> Learn how to configure firewalls for LiveKit Cloud.

## Corporate firewalls

LiveKit uses WebSocket and WebRTC to transmit data and media. All transmissions are encrypted with [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) and [DTLS](https://en.wikipedia.org/wiki/Datagram_Transport_Layer_Security).

LiveKit Cloud requires access to a few domains in order to establish a connection. If you are behind a corporate firewall, please ensure outbound traffic is allowed to the following addresses and ports:

| Host | Port | Purpose |
| *.livekit.cloud | TCP: 443 | Signal connection over secure WebSocket |
| *.turn.livekit.cloud | TCP: 443 | [TURN](https://en.wikipedia.org/wiki/Traversal_Using_Relays_around_NAT)/TLS. Used when UDP connection isn't viable |
| *.host.livekit.cloud | UDP: 3478 | TURN/UDP servers that assist in establishing connectivity |
| all hosts (optional) | UDP: 50000-60000 | UDP connection for WebRTC |
| all hosts (optional) | TCP: 7881 | TCP connection for WebRTC |

In order to obtain the best audio and video quality, we recommend allowing access to the UDP ports listed above. Additionally, please ensure UDP hole-punching is enabled (or disable symmetric NAT). This helps machines behind the firewall to establish a direct connection to a LiveKit Cloud media server.

## Minimum requirements

If wildcard hostnames are not allowed by your firewall or security policy, the following are the mimimum set of hostnames required to connect to LiveKit Cloud:

| Host | Port |
| `<your-subdomain>.livekit.cloud` | TCP 443 |
| `<your-subdomain>.sfo3.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dsfo3a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dsfo3b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dfra1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dfra1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dblr1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dblr1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dsgp1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dsgp1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dsyd1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.dsyd1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.osaopaulo1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.osaopaulo1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.oashburn1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.oashburn1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.omarseille1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.omarseille1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.otokyo1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.otokyo1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ophoenix1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ophoenix1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.olondon1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.olondon1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ochicago1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ochicago1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.osingapore1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.osingapore1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.odubai1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.odubai1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ohyderabad1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ohyderabad1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ojohannesburg1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ojohannesburg1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.omumbai1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.omumbai1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ofrankfurt1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ofrankfurt1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ojerusalem1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ojerusalem1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.osydney1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.osydney1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ozurich1a.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.ozurich1b.production.livekit.cloud` | TCP 443 |
| `<your-subdomain>.turn.livekit.cloud` | TCP 443 |
| `sfo3.turn.livekit.cloud` | TCP 443 |
| `dsfo3a.turn.livekit.cloud` | TCP 443 |
| `dsfo3b.turn.livekit.cloud` | TCP 443 |
| `dfra1a.turn.livekit.cloud` | TCP 443 |
| `dfra1b.turn.livekit.cloud` | TCP 443 |
| `dblr1a.turn.livekit.cloud` | TCP 443 |
| `dblr1b.turn.livekit.cloud` | TCP 443 |
| `dsgp1a.turn.livekit.cloud` | TCP 443 |
| `dsgp1b.turn.livekit.cloud` | TCP 443 |
| `dsyd1a.turn.livekit.cloud` | TCP 443 |
| `dsyd1b.turn.livekit.cloud` | TCP 443 |
| `osaopaulo1a.turn.livekit.cloud` | TCP 443 |
| `osaopaulo1b.turn.livekit.cloud` | TCP 443 |
| `oashburn1a.turn.livekit.cloud` | TCP 443 |
| `oashburn1b.turn.livekit.cloud` | TCP 443 |
| `omarseille1a.turn.livekit.cloud` | TCP 443 |
| `omarseille1b.turn.livekit.cloud` | TCP 443 |
| `otokyo1a.turn.livekit.cloud` | TCP 443 |
| `otokyo1b.turn.livekit.cloud` | TCP 443 |
| `ophoenix1a.turn.livekit.cloud` | TCP 443 |
| `ophoenix1b.turn.livekit.cloud` | TCP 443 |
| `olondon1a.turn.livekit.cloud` | TCP 443 |
| `olondon1b.turn.livekit.cloud` | TCP 443 |
| `ochicago1a.turn.livekit.cloud` | TCP 443 |
| `ochicago1b.turn.livekit.cloud` | TCP 443 |
| `osingapore1a.turn.livekit.cloud` | TCP 443 |
| `osingapore1b.turn.livekit.cloud` | TCP 443 |
| `odubai1a.turn.livekit.cloud` | TCP 443 |
| `odubai1b.turn.livekit.cloud` | TCP 443 |
| `ohyderabad1a.turn.livekit.cloud` | TCP 443 |
| `ohyderabad1b.turn.livekit.cloud` | TCP 443 |
| `ojohannesburg1a.turn.livekit.cloud` | TCP 443 |
| `ojohannesburg1b.turn.livekit.cloud` | TCP 443 |
| `omumbai1a.turn.livekit.cloud` | TCP 443 |
| `omumbai1b.turn.livekit.cloud` | TCP 443 |
| `ofrankfurt1a.turn.livekit.cloud` | TCP 443 |
| `ofrankfurt1b.turn.livekit.cloud` | TCP 443 |
| `ojerusalem1a.turn.livekit.cloud` | TCP 443 |
| `ojerusalem1b.turn.livekit.cloud` | TCP 443 |
| `osydney1a.turn.livekit.cloud` | TCP 443 |
| `osydney1b.turn.livekit.cloud` | TCP 443 |
| `ozurich1a.turn.livekit.cloud` | TCP 443 |
| `ozurich1b.turn.livekit.cloud` | TCP 443 |

> ℹ️ **Note**
> 
> This list of domains is subject to change. Last updated 2025-06-27.

---

This document was rendered at 2025-09-27T09:36:31.976Z.
For the latest version of this document, see [https://docs.livekit.io/home/cloud/firewall.md](https://docs.livekit.io/home/cloud/firewall.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).