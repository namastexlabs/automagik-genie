# Audio Pipeline Specification

## Overview

This document defines the complete audio pipeline for {{PROJECT_NAME}}, from input capture through processing to output. Adapt specifics (e.g., ASR/TTS) per {{TECH_STACK}}.

## Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                           │
├────────────────────────────────────────────────────────────── │
│                                                                │
│  Microphone → Capture → Encode → WebSocket → Server           │
│     48kHz     16kHz     Base64    JSON                        │
│                                                                │
│  Speaker ← Decode ← WebSocket ← Buffer ← Playback Queue       │
│   44.1kHz   Base64    JSON      Ordered                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                           │
├────────────────────────────────────────────────────────────── │
│                                                                │
│  Client WS → Decode → VAD → Buffer → ASR Provider             │
│    JSON      PCM-16k        Frames    Groq/Local              │
│                                                                │
│  Client WS ← Encode ← Chunk ← TTS Provider                    │
│    JSON      Base64           ElevenLabs                      │
└──────────────────────────────────────────────────────────────┘
```

## Audio Formats

### Input Pipeline (User Voice → ASR)

#### 1. Capture Format
```
Source: User microphone
Native Rate: 48000 Hz (typical)
Channels: 1-2 (device dependent)
Bit Depth: 16-bit
```

#### 2. Processing Format (Standardized)
```
Format: PCM
Sample Rate: 16000 Hz (downsampled)
Channels: 1 (mono, averaged if stereo)
Bit Depth: 16-bit signed
Byte Order: Little-endian
Frame Size: 320 bytes (20ms @ 16kHz)
```

#### 3. Transport Format
```
Encoding: Base64
Container: JSON WebSocket message
Chunking: 20-100ms per message
Max Size: 64KB per message
```

### Output Pipeline (TTS → Speaker)

#### 1. TTS Generation Format
```
Format: PCM
Sample Rate: 44100 Hz (high quality)
Alternative: 24000 Hz (bandwidth optimized)
Channels: 1 (mono)
Bit Depth: 16-bit signed
Byte Order: Little-endian
```

#### 2. Transport Format
```
Encoding: Base64
Container: JSON WebSocket message
Chunk Size: ~160ms (7056 bytes @ 44.1kHz)
Sequencing: event_id for ordering
```

#### 3. Playback Format
```
Format: PCM or Web Audio API
Sample Rate: 44100/24000 Hz (matches TTS)
Channels: 1-2 (mono expanded to stereo)
Buffer Strategy: Ring buffer with 5 chunks
```

## Frame Processing

### Input Frames (20ms windows)

```rust
// Frame structure @ 16kHz
struct AudioFrame {
    samples: [i16; 160],  // 20ms = 160 samples
    timestamp: u64,       // Microseconds
    energy: f32,         // RMS energy
}

// Processing pipeline
fn process_input_frame(raw: &[u8]) -> AudioFrame {
    // 1. Convert bytes to samples
    let samples = bytes_to_i16_le(raw);

    // 2. Apply pre-emphasis filter
    let filtered = pre_emphasis(samples, 0.97);

    // 3. Calculate energy for VAD
    let energy = calculate_rms(filtered);

    // 4. Package frame
    AudioFrame { samples: filtered, timestamp, energy }
}
```

### Output Chunks (160ms windows)

```rust
// Chunk structure @ 44.1kHz
struct AudioChunk {
    samples: Vec<i16>,    // ~7056 samples
    event_id: u32,       // Sequence number
    is_final: bool,      // Last chunk marker
}

// Chunk assembly
fn assemble_chunk(tts_data: &[u8], event_id: u32) -> AudioChunk {
    // 1. Decode from provider format
    let samples = decode_tts_format(tts_data);

    // 2. Apply fade if needed
    let processed = apply_fade_if_final(samples);

    // 3. Package chunk
    AudioChunk { samples: processed, event_id, is_final }
}
```

## Buffer Management

### Input Buffer (ASR)

```yaml
Type: Ring Buffer
Size: 10 frames (200ms)
Strategy: Sliding window
Triggers:
  - VAD activation (energy > threshold)
  - Silence detection (energy < threshold for 300ms)
  - Force flush (buffer full)
```

### Output Buffer (TTS Playback)

```yaml
Type: Priority Queue
Size: 5 chunks (800ms @ 160ms/chunk)
Ordering: By event_id
Strategy:
  - Prefetch next 2 chunks
  - Drop on interruption
  - Fade on cancel
```

## VAD Processing

### Energy-Based VAD

```python
# Thresholds
ENERGY_THRESHOLD = 0.01  # RMS threshold
ZERO_CROSSING_RATE = 0.1  # ZCR threshold
ACTIVATION_FRAMES = 3  # Frames to activate
DEACTIVATION_FRAMES = 15  # Frames to deactivate (300ms)

# State machine
class VADState(Enum):
    SILENCE = 0
    MAYBE_SPEECH = 1
    SPEECH = 2
    MAYBE_SILENCE = 3
```

### ML-Based VAD (Optional)

```yaml
Model: Silero VAD or WebRTC VAD
Window: 30-50ms
Output: Probability [0.0, 1.0]
Threshold: 0.5 for speech
Smoothing: Moving average over 3 frames
```

## Interruption Handling

### Barge-in Detection
```
1. Monitor VAD score during TTS playback
2. If VAD > 0.6 for 2 consecutive frames:
   - Set interruption flag
   - Note current event_id
   - Begin fade-out
```

### Cancel Modes

#### Soft Cancel (Default)
```python
def soft_cancel(audio_buffer, fade_ms=60):
    fade_samples = int(sample_rate * fade_ms / 1000)
    for i in range(fade_samples):
        factor = 1.0 - (i / fade_samples)
        audio_buffer[i] *= factor
    return audio_buffer[:fade_samples]
```

#### Hard Cancel
```python
def hard_cancel(audio_buffer):
    return []  # Immediate stop
```

## Chunk Scheduling

### Default Schedule
```json
{
  "chunk_length_schedule": [50, 120, 200, 280],
  "explanation": "Characters before generation triggers"
}
```

### Optimized for Latency
```json
{
  "chunk_length_schedule": [50, 120, 160, 290],
  "explanation": "Faster first chunk, longer tail"
}
```

### Flush Behavior
```python
def should_flush(text_buffer, is_turn_end):
    if is_turn_end:
        return True  # Always flush on turn end
    if len(text_buffer) >= current_schedule_threshold:
        return True
    if time_since_last_char > 500:  # 500ms timeout
        return True
    return False
```

## Codec Considerations

### PCM Encoding/Decoding

```rust
// PCM to Base64
fn encode_pcm_to_base64(samples: &[i16]) -> String {
    let bytes: Vec<u8> = samples.iter()
        .flat_map(|&sample| sample.to_le_bytes())
        .collect();
    base64::encode(&bytes)
}

// Base64 to PCM
fn decode_base64_to_pcm(encoded: &str) -> Vec<i16> {
    let bytes = base64::decode(encoded).unwrap();
    bytes.chunks_exact(2)
        .map(|chunk| i16::from_le_bytes([chunk[0], chunk[1]]))
        .collect()
}
```

### Resampling (If Needed)

```rust
use rubato::Resampler;

fn resample_audio(
    input: &[i16],
    from_rate: u32,
    to_rate: u32
) -> Vec<i16> {
    let resampler = SincFixedIn::<f32>::new(
        to_rate as f64 / from_rate as f64,
        2.0,  // Max 2x rate change
        256,  // Chunk size
        2,    // Quality (0-10)
    );
    // Process resampling...
}
```

## Memory Alignment

### Optimal Buffer Sizes
```
Input: 320 bytes (20ms @ 16kHz)
Output: 7056 bytes (160ms @ 44.1kHz)
WebSocket Frame: Max 64KB
Base64 Overhead: ~33% increase
```

### Cache Optimization
```rust
#[repr(align(64))]  // Cache line alignment
struct AlignedAudioBuffer {
    data: [u8; 8192],
}
```

## Error Recovery

### Dropout Handling
```python
def handle_audio_dropout(buffer, last_good_frame):
    # Simple interpolation
    if buffer.is_empty():
        return repeat_with_decay(last_good_frame, 0.9)
    return buffer
```

### Packet Loss Concealment
```python
def conceal_lost_packet(prev, next):
    # Linear interpolation
    interpolated = []
    for i in range(len(prev)):
        factor = i / len(prev)
        sample = prev[i] * (1 - factor) + next[i] * factor
        interpolated.append(sample)
    return interpolated
```

## Performance Metrics

### Target Latencies
```yaml
Frame Processing: < 5ms
VAD Decision: < 10ms
Buffer Operations: < 1ms
Encode/Decode: < 5ms
Network Transport: < 50ms (regional)
```

### Memory Usage
```yaml
Input Buffer: 3.2KB (10 frames)
Output Buffer: 35KB (5 chunks)
Codec Working Memory: < 100KB
Total Per Connection: < 150KB
```

## Testing Procedures

### Audio Quality Tests
1. **THD+N**: < 1% distortion
2. **SNR**: > 40dB
3. **Frequency Response**: 20Hz-8kHz (±3dB)

### Latency Tests
1. **End-to-end**: Mic → ASR → TTS → Speaker
2. **Target**: < 200ms (P50), < 300ms (P99)
3. **Measurement**: Using loopback with timestamps

### Stress Tests
1. **Concurrent Streams**: 100+ connections
2. **CPU Usage**: < 5% per stream
3. **Memory Stability**: No leaks over 24 hours

## Implementation Checklist

- [ ] PCM 16kHz input capture
- [ ] PCM 44.1kHz output playback
- [ ] Base64 encoding/decoding
- [ ] Ring buffer for input
- [ ] Priority queue for output
- [ ] VAD processing
- [ ] Soft/hard cancel modes
- [ ] Event ID sequencing
- [ ] Chunk scheduling
- [ ] Flush on turn end
- [ ] Interruption detection
- [ ] Fade in/out processing
- [ ] Error concealment
- [ ] Metrics collection

## References

- PCM Format: https://en.wikipedia.org/wiki/Pulse-code_modulation
- WebRTC VAD: https://github.com/wiseman/py-webrtcvad
- Base64 Encoding: RFC 4648
- Web Audio API: https://www.w3.org/TR/webaudio/
