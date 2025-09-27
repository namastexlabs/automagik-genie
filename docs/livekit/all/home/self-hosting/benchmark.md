LiveKit Docs › Self-hosting › Benchmarks

---

# Benchmarking

> Guide to load-testing and benchmarking your LiveKit installation.

## Measuring performance

LiveKit can scale to many simulteneous rooms by running a distributed setup across multiple nodes. However, each room must fit within a single node. For this reason, benchmarks below will be focused on stressing the number of concurrent users in a room.

With WebRTC SFUs, a few factors determine the amount of work a server could perform:

- Number of tracks published
- Number of subscribers
- Amount of data sent to each subscriber

An SFU needs to perform work to receive every track - this means receiving tens of packets per second. It then needs to forward that received data to every subscriber. That adds up to a significant amount of work in decryption and encryption, packet processing, and data forwarding.

Due to these variations, it can be difficult to understand the capacity of the SFU for an specific application. We provide tooling that help with simulating workload according to your specifications.

## Load testing

The LiveKit [CLI](https://github.com/livekit/livekit-cli) includes the `lk load-test` subcommand, which can simulate real-world loading conditions for various scenarios. It uses the Go SDK to simulate publishers and subscribers in a room.

When publishing, it could send both video and audio tracks:

- video: looping video clips at 720p, with keyframes every ~3s (simulcast enabled)
- audio: sends blank packets that aren't audible, but would simulate a target bitrate.

As a subscriber, it can simulate an application that takes advantage of adaptive stream, rendering a specified number of remote streams on-screen.

When benchmarking with the load tester, be sure to run it on a machine with plenty of CPU and bandwidth, and ensure it has sufficient file handles (`ulimit -n 65535`). You can also run the load tester from multiple machines.

> 🔥 **Caution**
> 
> Load testing traffic on your cloud instance _will_ count toward your [quotas](https://docs.livekit.io/home/cloud/quotas-and-limits.md), and is subject to the limits of your plan.

## Benchmarks

We've run benchmarks for a few common scenarios to give a general understanding of performance. All benchmarks below are to demonstrate max number of participants supported in a single room.

All benchmarks were ran with the server running on a 16-core, compute optimized instance on Google Cloud. ( `c2-standard-16`)

In the tables below:

- `Pubs` - Number of publishers
- `Subs` - Number of subscribers

### Audio only

This simulates an audio only experience with a large number of listeners in the room. It uses an average audio bitrate of 3kbps. In large audio sessions, only a small number of people are usually speaking (while everyone are on mute). We use 10 as the approximate number of speakers here.

| Use case | Pubs | Subs | Bytes/s in/out | Packets/s in/out | CPU utilization |
| Large audio rooms | 10 | 3000 | 7.3 kBps / 23 MBps | 305 / 959,156 | 80% |

Command:

```shell
lk load-test \
  --url <YOUR-SERVER-URL> \
  --api-key <YOUR-KEY> \
  --api-secret <YOUR-SECRET> \
  --room load-test \
  --audio-publishers 10 \
  --subscribers 1000

```

### Video room

Default video resolution of 720p was used in the load tests.

| Use case | Pubs | Subs | Bytes/s in/out | Packets/s in/out | CPU utilization |
| Large meeting | 150 | 150 | 50 MBps / 93 MBps | 51,068 / 762,749 | 85% |
| Livestreaming | 1 | 3000 | 233 kBps / 531 MBps | 246 / 560,962 | 92% |

To simulate large meeting:

```shell
lk load-test \
  --url <YOUR-SERVER-URL> \
  --api-key <YOUR-KEY> \
  --api-secret <YOUR-SECRET> \
  --room load-test \
  --video-publishers 150 \
  --subscribers 150

```

To simulate livestreaming:

```shell
lk load-test \
  --url <YOUR-SERVER-URL> \
  --api-key <YOUR-KEY> \
  --api-secret <YOUR-SECRET> \
  --room load-test \
  --video-publishers 1 \
  --subscribers 3000 \

```

---

This document was rendered at 2025-09-27T09:36:40.350Z.
For the latest version of this document, see [https://docs.livekit.io/home/self-hosting/benchmark.md](https://docs.livekit.io/home/self-hosting/benchmark.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).