# Transcript Schema (ElevenLabs Compatible)

## Overview

Our transcript format exactly matches ElevenLabs' conversation transcript schema for complete compatibility. Every conversation is logged as an array of turn objects.

## Complete Schema

```typescript
interface TranscriptTurn {
  // Role identification
  role: "agent" | "user";

  // Agent metadata (null for user turns)
  agent_metadata: {
    agent_id: string;
    workflow_node_id: string | null;
  } | null;

  // The actual message content
  message: string | null;

  // Multi-voice support (future)
  multivoice_message: null;

  // Tool interactions
  tool_calls: ToolCall[];
  tool_results: ToolResult[];

  // User feedback
  feedback: null;

  // LLM override
  llm_override: null;

  // Timing
  time_in_call_secs: number;

  // Performance metrics
  conversation_turn_metrics: {
    metrics: {
      // TTS metrics
      convai_tts_service_ttfb?: {
        elapsed_time: number; // seconds
      };

      // LLM metrics
      convai_llm_service_ttfb?: {
        elapsed_time: number;
      };
      convai_llm_service_ttf_sentence?: {
        elapsed_time: number;
      };
      convai_llm_service_tt_last_sentence?: {
        elapsed_time: number;
      };

      // ASR metrics
      convai_asr_trailing_service_latency?: {
        elapsed_time: number;
      };

      // Tool metrics
      convai_llm_tool_request_generation_latency?: {
        elapsed_time: number;
      };
    };
  } | null;

  // RAG/Knowledge base
  rag_retrieval_info: {
    chunks: Array<{
      document_id: string;
      chunk_id: string;
      vector_distance: number;
    }>;
    embedding_model: string;
    retrieval_query: string;
    rag_latency_secs: number;
  } | null;

  // LLM token usage
  llm_usage: {
    model_usage: {
      [model: string]: {
        input: {
          tokens: number;
          price: number;
        };
        input_cache_read: {
          tokens: number;
          price: number;
        };
        input_cache_write: {
          tokens: number;
          price: number;
        };
        output_total: {
          tokens: number;
          price: number;
        };
      };
    };
  } | null;

  // Interruption handling
  interrupted: boolean;
  original_message: string | null;

  // Input source
  source_medium: "audio" | null;
}
```

## Tool Call Schema

```typescript
interface ToolCall {
  type: "client" | "server";
  request_id: string;
  tool_name: string;
  params_as_json: string;
  tool_has_been_called: boolean;
  tool_details: {
    type: string;
    parameters: string;
  };
}

interface ToolResult {
  request_id: string;
  tool_name: string;
  result_value: string;
  is_error: boolean;
  tool_has_been_called: boolean;
  tool_latency_secs: number;
  dynamic_variable_updates: any[];
  type: "client" | "server";
}
```

## Metric Definitions

### TTS Metrics
- **convai_tts_service_ttfb**: Time to first byte of audio from TTS service
  - Target: < 200ms (p50), < 815ms (p95)
  - Measured from: Text sent → First audio chunk received

### LLM Metrics
- **convai_llm_service_ttfb**: Time to first byte from LLM
  - Typical: 900ms - 3.5s
  - Measured from: Prompt sent → First token received

- **convai_llm_service_ttf_sentence**: Time to first complete sentence
  - Typical: 930ms - 2.8s
  - Measured from: Prompt sent → First sentence delimiter

- **convai_llm_service_tt_last_sentence**: Time to last sentence
  - Typical: 1.2s - 3s
  - Measured from: Prompt sent → Final sentence complete

### ASR Metrics
- **convai_asr_trailing_service_latency**: Post-speech processing time
  - Target: < 300ms (p50), < 800ms (p95)
  - Measured from: Speech end → Transcript ready

### Tool Metrics
- **convai_llm_tool_request_generation_latency**: Time to generate tool call
  - Typical: 1.2s - 3.5s
  - Measured from: Decision → Tool call formatted

## Example Turn Objects

### User Turn
```json
{
  "role": "user",
  "agent_metadata": null,
  "message": "What's my account balance?",
  "multivoice_message": null,
  "tool_calls": [],
  "tool_results": [],
  "feedback": null,
  "llm_override": null,
  "time_in_call_secs": 5,
  "conversation_turn_metrics": {
    "metrics": {
      "convai_asr_trailing_service_latency": {
        "elapsed_time": 0.150
      }
    }
  },
  "rag_retrieval_info": null,
  "llm_usage": null,
  "interrupted": false,
  "original_message": null,
  "source_medium": "audio"
}
```

### Agent Turn
```json
{
  "role": "agent",
  "agent_metadata": {
    "agent_id": "agent_xxx",
    "workflow_node_id": null
  },
  "message": "I can help you check your balance.",
  "multivoice_message": null,
  "tool_calls": [],
  "tool_results": [],
  "feedback": null,
  "llm_override": null,
  "time_in_call_secs": 8,
  "conversation_turn_metrics": {
    "metrics": {
      "convai_tts_service_ttfb": {
        "elapsed_time": 0.132
      },
      "convai_llm_service_ttfb": {
        "elapsed_time": 1.549
      }
    }
  },
  "rag_retrieval_info": null,
  "llm_usage": {
    "model_usage": {
      "gpt-oss-120b": {
        "input": {"tokens": 1500, "price": 0.0},
        "input_cache_read": {"tokens": 0, "price": 0.0},
        "input_cache_write": {"tokens": 0, "price": 0.0},
        "output_total": {"tokens": 50, "price": 0.0}
      }
    }
  },
  "interrupted": false,
  "original_message": null,
  "source_medium": null
}
```

### Interrupted Turn
```json
{
  "role": "agent",
  "message": "Let me tell you about...",
  "interrupted": true,
  "original_message": "Let me tell you about all the features we offer including...",
  "conversation_turn_metrics": {
    "metrics": {
      "convai_tts_service_ttfb": {
        "elapsed_time": 0.781
      }
    }
  }
}
```

## Storage Format

Transcripts are stored as:
- **Format**: JSON array
- **File naming**: choose a path that aligns with the active wish (for example `artifacts/transcript_raw.json`)
- **Encoding**: UTF-8
- **Compression**: Optional gzip for archival

> Note: The current repository does not generate or persist transcripts automatically; use this section as guidance when you decide to archive them.

## Compatibility Notes

1. **Field Order**: Maintain exact field order for byte-for-byte compatibility
2. **Null Values**: Use `null` not `undefined` for missing values
3. **Timestamps**: All times in seconds (not milliseconds)
4. **IDs**: Use UUID v4 format for all IDs
5. **Prices**: Always include even if 0.0

## Validation

To validate transcript compatibility:

```bash
# Check schema matches
jq 'map(keys)' transcript.json | sort -u

# Verify metrics present
jq '.[].conversation_turn_metrics.metrics | keys' transcript.json

# Check timing monotonicity
jq '.[].time_in_call_secs' transcript.json
```
