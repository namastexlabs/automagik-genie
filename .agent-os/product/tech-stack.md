# Technical Stack

## Core Runtime
- application_framework: Rust (Tokio 1.x, Axum 0.7)
- database_system: SQLite (dev) → PostgreSQL (prod) for metrics/experiments
- javascript_framework: None (thin HTML + htmx 1.9 for demos)
- import_strategy: importmaps
- css_framework: Tailwind CSS 3.4
- ui_component_library: None (headless patterns)
- fonts_provider: Google Fonts (localizable)
- icon_library: Lucide

## Speech + Realtime
- TTS primary: ElevenLabs Flash v2.5 over raw WebSocket stream‑input
- TTS experimental: ElevenLabs v3 alpha multi‑context (explicit opt‑in)
- STT primary: Groq Whisper‑large‑v3‑turbo (real‑time, low latency)
- STT fallback: WhisperX or faster‑whisper (local, quantized options)
- Turn‑taking: VAD + heuristics baseline; ASD/diarization via pyannote/other HF models

## Hosting + Deployment
- application_hosting: Fly.io or AWS ECS/Fargate (Rust friendly, regional pinning)
- database_hosting: Neon (PostgreSQL) or SQLite + Litestream (S3)
- asset_hosting: Cloudflare R2/Pages or S3 + CloudFront
- deployment_solution: Docker, GitHub Actions CI → Flyctl/AWS deploy
- code_repository_url: TBD (this repository)

## Observability
- Tracing: OpenTelemetry (otlp), Tokio console (dev)
- Metrics: Prometheus exposition + Grafana dashboards
- Logging: JSON structured logs with per‑turn correlation IDs

## Safety + Limits
- Call/stream limits: configurable per connection
- Region pinning: provider‑side selection where available
- Privacy: PII redaction hooks, transcript sanitization

## Notes
- ElevenLabs v3 alpha paths are used only when `EXPERIMENTAL_TTS_V3=1` is set to explicitly opt‑in.
- Local STT fallbacks are optional and can run quantized for edge devices.

