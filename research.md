perfect—set up a living spec for us and dropped in the initial blueprint. we’ll keep packing it with decisions and code as we go.

quick hits on your asks:

* **Docs “blueprint”**: ElevenLabs actually *does* publish all the bits you need:
  – **TTS streaming WebSocket (`stream-input`)** and a **multi-context** variant for overlapping streams. ([ElevenLabs][1])
  – **Agents WebSocket** (handshake + event shapes) so we can mirror their schema on our server. ([ElevenLabs][2])
  – A focused **latency optimization** guide (Flash/Turbo, streaming, region pinning, voice choice). ([ElevenLabs][3])
  – The docs index you sent (llms.txt) links to real-time streaming, multi-context, agents quickstart, etc. (I pulled it). ([ElevenLabs][4])
  – Also: “generate audio in real-time” overview + generic streaming notes. ([ElevenLabs][5])

* **Use SDK or raw sockets?** For the **hot path**, raw **WebSocket** wins (precise control over partial text, `flush`, chunk schedules, and warm connections). SDKs are fine for management (voice lists, CRUD). ([ElevenLabs][1])

* **Eleven v3 (alpha) for calls**: their docs explicitly say it’s **not for real-time Agents**. Use **Flash v2.5** (fastest ~75ms TTS) or **Turbo v2.5** when you need more quality. I added that guidance to the doc. ([ElevenLabs][4])

* **Whisper plan**: Primary **Groq Whisper-large-v3-turbo** (fast, $0.04/hr; billed min 10s). Local fallback via **whisper.cpp** (`whisper-rs`) preloaded. ([Groq][6])

* **Turn-taking/AST**: Start with **VAD + heuristics** (300–500ms silence), then evaluate **pyannote** (quality) and a tiny ONNX turn-end classifier if needed. I listed model options in the doc; we can also test **pipecat-ai/smart-turn-v3**. ([Hugging Face][7])

* **Local TTS fallback**: **VibeVoice** (1.5B/7B; quantized variants exist) and **ResembleAI Chatterbox** (multilingual; has watermarking). Both linked for reference. ([Hugging Face][8])

I also generated two diagrams you can download (we’ll iterate them as we refine):

* [Architecture diagram](sandbox:/mnt/data/voice_agent_architecture.png)
* [Turn sequence diagram](sandbox:/mnt/data/voice_agent_sequence.png)

if you want, next I’ll scaffold the Rust repo layout from the document (Axum WS handler, ElevenLabs TTS WS client with `flush`, Groq STT client stub, VAD gate, metrics) so you can run a minimal “speak back” demo that achieves sub-second **time-to-first-audio**.

[1]: https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input?utm_source=chatgpt.com "WebSocket | ElevenLabs Documentation"
[2]: https://elevenlabs.io/docs/agents-platform/api-reference/agents-platform/websocket?utm_source=chatgpt.com "Agent WebSockets | ElevenLabs Documentation"
[3]: https://elevenlabs.io/docs/best-practices/latency-optimization?utm_source=chatgpt.com "Latency optimization | ElevenLabs Documentation"
[4]: https://elevenlabs.io/docs/llms.txt "elevenlabs.io"
[5]: https://elevenlabs.io/docs/websockets?utm_source=chatgpt.com "Generate audio in real-time | ElevenLabs Documentation"
[6]: https://groq.com/pricing?utm_source=chatgpt.com "Groq On-Demand Pricing for Tokens-as-a-Service"
[7]: https://huggingface.co/pyannote/voice-activity-detection?utm_source=chatgpt.com "pyannote/voice-activity-detection"
[8]: https://huggingface.co/vibevoice/VibeVoice-7B?utm_source=chatgpt.com "vibevoice/VibeVoice-7B"
