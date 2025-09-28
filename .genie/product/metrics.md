# Metrics Definitions

## Overview

Precise definitions for all metrics used in {{PROJECT_NAME}} (or your project after install). Adapt to your domain; examples: latency budgets, throughput, accuracy, quality.

## Latency Metrics

### TTFB (Time to First Byte)
- **Definition**: Time from end of user speech to first byte of agent audio
- **Measurement Point**: VAD speech-end event → TTS first audio chunk
- **Unit**: Milliseconds (ms)
- **Target**: < 200ms (P50), < 300ms (P99)
- **Calculation**: `ttfb_ms = timestamp(first_tts_byte) - timestamp(vad_speech_end)`

### ASR Latency
- **Definition**: Time from audio chunk receipt to transcript generation
- **Measurement Point**: Audio frame received → ASR result available
- **Unit**: Milliseconds (ms)
- **Target**: < 150ms (P50), < 300ms (P95)
- **Calculation**: `asr_latency_ms = timestamp(transcript) - timestamp(audio_chunk)`

### Turn Transition Time
- **Definition**: Time from user speech end to agent speech start (including silence)
- **Measurement Point**: VAD user-end → VAD agent-start
- **Unit**: Milliseconds (ms)
- **Target**: 250-350ms (natural pause)
- **Calculation**: `turn_transition_ms = timestamp(agent_speech_start) - timestamp(user_speech_end)`

### Interruption Response Time
- **Definition**: Time from user interruption to agent stopping
- **Measurement Point**: User barge-in detected → Agent audio stopped
- **Unit**: Milliseconds (ms)
- **Target**: < 80ms
- **Calculation**: `interrupt_response_ms = timestamp(agent_stop) - timestamp(barge_in_detected)`

## Quality Metrics

### ASR Confidence
- **Definition**: Speech recognition confidence score
- **Source**: Whisper model output
- **Range**: 0.0 to 1.0
- **Target**: > 0.8 average
- **Threshold**: < 0.6 triggers clarification

### TTS Artifacts Count
- **Definition**: Number of audio quality issues in TTS output
- **Types**: Clicks, pops, truncations, silence gaps
- **Unit**: Count per conversation
- **Target**: 0
- **Detection**: Audio signal analysis + user complaints

### None Response Rate
- **Definition**: Percentage of agent turns that produce "None" or empty response
- **Calculation**: `none_rate = (none_responses / total_agent_turns) * 100`
- **Unit**: Percentage (%)
- **Target**: < 1%
- **Critical**: > 5% indicates system failure

## Turn-Taking Metrics

### Interruption Count
- **Definition**: Number of times one party interrupts the other
- **Types**:
  - User interrupts agent
  - Agent interrupts user
- **Unit**: Count per conversation
- **Normal Range**: 1-3 per conversation

### Overlap Duration
- **Definition**: Total time both parties speak simultaneously
- **Measurement**: Sum of all overlap periods
- **Unit**: Milliseconds (ms)
- **Calculation**: `overlap_ms = sum(overlap_end - overlap_start)`

### Backchannel Count
- **Definition**: Number of brief acknowledgments ("mm-hmm", "certo", "sim")
- **Unit**: Count per conversation
- **Expected**: 1 every 20-30 seconds of agent speech

### Turn Count
- **Definition**: Total number of speaker changes
- **Calculation**: Count of user→agent and agent→user transitions
- **Unit**: Integer
- **Typical**: 10-30 for successful conversations

## Conversation Metrics

### Duration
- **Definition**: Total conversation time from start to end
- **Measurement**: Connection open → Connection close
- **Unit**: Seconds
- **Typical Range**: 60-180 seconds
- **Warning**: > 300 seconds may indicate unresolved issues

### Message Count
- **Definition**: Total number of messages exchanged
- **Includes**: User utterances + Agent responses
- **Unit**: Integer
- **Typical**: 15-25 for successful conversations
- **Failed Pattern**: < 5 (early termination) or > 30 (loops)

### Success Rate
- **Definition**: Percentage of conversations that complete successfully
- **Calculation**: `success_rate = (successful_conversations / total_conversations) * 100`
- **Success Criteria**: User goal achieved or proper escalation
- **Target**: > 90%
- **Current Production**: 73.2%

## Human-Likeness Score

Composite metric for naturalness evaluation:

### Components
1. **Turn-Taking Naturalness** (35%)
   - Smooth transitions
   - Appropriate interruptions
   - Natural pauses

2. **Latency Perception** (35%)
   - Consistent response times
   - No dead air
   - Fluid conversation flow

3. **Technical Quality** (20%)
   - ASR accuracy
   - TTS clarity
   - No artifacts

4. **Conversation Flow** (10%)
   - Logical progression
   - Context retention
   - Appropriate responses

### Calculation
```
human_likeness_score = (
    turn_taking_score * 0.35 +
    latency_score * 0.35 +
    technical_score * 0.20 +
    flow_score * 0.10
)
```

### Scale
- 1-10 (10 = indistinguishable from human)
- Target: ≥ 8
- Current Production Estimate: ~6

## Performance Percentiles

### Standard Percentiles Tracked
- **P50** (Median): Typical performance
- **P95**: Most requests
- **P99**: Nearly all requests
- **P99.9**: Worst case scenarios

### Example TTFB Distribution
```
P50:  250ms  (half of responses faster)
P95:  450ms  (95% of responses faster)
P99:  800ms  (99% of responses faster)
P99.9: 1500ms (worst case)
```

## Connection Quality Metrics

### Perceived Quality Score
- **Definition**: User's subjective assessment of connection quality
- **Indicators**:
  - "ligação está horrível" (connection is horrible)
  - "Alô?" repetitions
  - Request to call again
- **Scale**: 1-10
- **Warning**: < 7 correlates with failure

### Packet Loss Rate
- **Definition**: Percentage of audio packets lost
- **Calculation**: `loss_rate = (lost_packets / total_packets) * 100`
- **Acceptable**: < 1%
- **Degraded**: 1-3%
- **Unusable**: > 3%

### Jitter
- **Definition**: Variation in packet arrival time
- **Unit**: Milliseconds (ms)
- **Acceptable**: < 30ms
- **Impact**: Affects audio smoothness

## Metrics Collection Format

Following ElevenLabs conversation API schema:

```json
{
  "conversation_id": "conv_xxx",
  "agent_id": "agent_xxx",
  "started_at": 1234567890,
  "duration": 120.5,
  "message_count": 24,
  "call_successful": true,
  "transcript": [...],
  "metrics": {
    "ttfb": {
      "values": [250, 280, 310],
      "p50": 280,
      "p95": 310,
      "p99": 310
    },
    "asr_confidence": {
      "values": [0.85, 0.92, 0.78],
      "average": 0.85,
      "low_confidence_count": 0
    },
    "none_responses": 0,
    "interruptions": {
      "user_interrupts_agent": 2,
      "agent_interrupts_user": 1
    },
    "turn_transitions": 12,
    "backchannels": 3
  }
}
```

## Monitoring Thresholds

### Alert Levels

**Critical** (Immediate Action):
- None Response Rate > 5%
- TTFB P99 > 1000ms
- Success Rate < 60%

**Warning** (Investigation Required):
- None Response Rate > 1%
- TTFB P95 > 500ms
- ASR Confidence < 0.7
- Success Rate < 80%

**Info** (Track Trends):
- Interruption Count > 5
- Duration > 300s
- Message Count > 30
