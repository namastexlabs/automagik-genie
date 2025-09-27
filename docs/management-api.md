# ElevenLabs Agents Platform Management APIs

## Overview

Complete API reference for managing ElevenLabs Agents, including agent lifecycle, conversations, knowledge bases, tools, and testing. These APIs complement the WebSocket real-time protocol documented in `websocket-protocol.md`. For a high-level summary of the surfaces we plan to expose in Automagik Hello, see [API Overview](api-overview.md).

## Base Configuration

- **Base URL**: `https://api.elevenlabs.io`
- **Authentication**:
  - Header: `xi-api-key: YOUR_API_KEY` or
  - Header: `Authorization: Bearer YOUR_API_KEY`
- **Content-Type**: `application/json`

## 1. Agent Management

### Core Agent Operations

```bash
# Create Agent
POST /v1/convai/agents
Body: {
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "You are a helpful assistant",
        "model": "gpt-oss-120b",
        "temperature": 0.7,
        "max_tokens": 150
      },
      "first_message": "Hello! How can I help you today?",
      "language": "en"
    },
    "tts": {
      "model_id": "eleven_flash_v2_5",
      "voice_id": "voice_XXXXXXXX",
      "optimize_streaming_latency": 3,
      "output_format": "pcm_44100"
    },
    "stt": {
      "model": "whisper-large-v3-turbo",
      "language": "auto"
    }
  },
  "name": "Customer Support Agent",
  "platform_settings": {
    "auth": {
      "mode": "public"
    }
  }
}

# List Agents
GET /v1/convai/agents?page_size=10&page=1

# Get Agent Details
GET /v1/convai/agents/{agent_id}

# Update Agent
PUT /v1/convai/agents/{agent_id}
Body: { /* Same structure as create */ }

# Delete Agent
DELETE /v1/convai/agents/{agent_id}

# Duplicate Agent
POST /v1/convai/agents/{agent_id}/duplicate
Body: {
  "name": "Copy of Agent"
}
```

### Agent Configuration Schema

```typescript
interface AgentConfig {
  conversation_config: {
    agent: {
      prompt: {
        prompt: string;
        model: string;  // "gpt-oss-120b"
        temperature?: number;
        max_tokens?: number;
        tool_ids?: string[];
        knowledge_base_ids?: string[];
      };
      first_message?: string;
      language?: string;
      boosted_keywords?: string[];
      pronunciation_dictionary?: Record<string, string>;
    };
    tts: {
      model_id: string;  // "eleven_flash_v2_5" or "eleven_turbo_v2_5"
      voice_id: string;
      optimize_streaming_latency?: number;  // 1-4
      output_format?: string;  // "pcm_44100"
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    };
    stt: {
      model?: string;  // "whisper-large-v3-turbo"
      language?: string;  // "auto" or ISO code
    };
    turn_detection?: {
      type?: "server_vad" | "none";
      silence_duration_ms?: number;
      prefix_padding_ms?: number;
      threshold?: number;
    };
  };
  name: string;
  platform_settings?: {
    auth?: {
      mode: "public" | "private";
      api_keys?: string[];
    };
    widget?: {
      variant?: string;
      color_scheme?: string;
    };
    data_collection?: {
      enabled: boolean;
      fields?: string[];
    };
    retention?: {
      conversation_days?: number;
      audio_days?: number;
    };
  };
}
```

### Agent Versioning

```bash
# Get Agent Versions
GET /v1/convai/agents/{agent_id}/versions

# Get Specific Version
GET /v1/convai/agents/{agent_id}/versions/{version_id}

# Restore Version
POST /v1/convai/agents/{agent_id}/versions/{version_id}/restore

# Create Version Snapshot
POST /v1/convai/agents/{agent_id}/versions
Body: {
  "description": "Production release v2.1"
}
```

## 2. Conversation Management

### Conversation Operations

```bash
# List Conversations
GET /v1/convai/conversations?agent_id={agent_id}&page_size=20

# Get Conversation Details (includes full transcript)
GET /v1/convai/conversations/{conversation_id}
Response: {
  "conversation_id": "conv_xxx",
  "agent_id": "agent_xxx",
  "status": "ended",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T10:05:30Z",
  "duration_seconds": 330,
  "transcript": [/* Array of TranscriptTurn objects */],
  "metadata": {
    "user_ip": "xxx.xxx.xxx.xxx",
    "session_id": "sess_xxx"
  },
  "analysis": {
    "success_evaluation": { /* if configured */ },
    "data_collection": { /* if configured */ }
  }
}

# Delete Conversation
DELETE /v1/convai/conversations/{conversation_id}

# Get Conversation Audio
GET /v1/convai/conversations/{conversation_id}/audio
Response: Audio file stream

# Get Signed URL for Audio
GET /v1/convai/conversations/{conversation_id}/signed-url
Response: {
  "signed_url": "https://...",
  "expires_at": "2024-01-15T11:00:00Z"
}

# Send Conversation Feedback
POST /v1/convai/conversations/{conversation_id}/feedback
Body: {
  "rating": 5,
  "feedback": "Great experience",
  "metadata": {}
}
```

### Batch Export

```bash
# Export Multiple Conversations
POST /v1/convai/conversations/export
Body: {
  "agent_id": "agent_xxx",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "format": "json",  // or "csv"
  "include_audio": false
}
Response: {
  "export_id": "export_xxx",
  "status": "processing"
}

# Check Export Status
GET /v1/convai/conversations/export/{export_id}
```

## 3. Knowledge Base Management

```bash
# Create Document from Text
POST /v1/convai/knowledge-base/documents/from-text
Body: {
  "name": "Product FAQ",
  "content": "Q: What is...\nA: ...",
  "metadata": {
    "category": "support",
    "version": "1.0"
  }
}

# Create Document from URL
POST /v1/convai/knowledge-base/documents/from-url
Body: {
  "url": "https://docs.example.com/faq",
  "name": "Online FAQ"
}

# List Documents
GET /v1/convai/knowledge-base/documents

# Update Document
PUT /v1/convai/knowledge-base/documents/{document_id}

# Delete Document
DELETE /v1/convai/knowledge-base/documents/{document_id}

# Compute RAG Index
POST /v1/convai/knowledge-base/documents/{document_id}/rag-index
Body: {
  "chunk_size": 512,
  "chunk_overlap": 128,
  "embedding_model": "text-embedding-ada-002"
}

# Get RAG Index Status
GET /v1/convai/knowledge-base/documents/{document_id}/rag-indexes
```

## 4. Tool Management

```bash
# Create Tool
POST /v1/convai/tools
Body: {
  "type": "client",  // or "server"
  "name": "get_account_balance",
  "description": "Retrieve user account balance",
  "parameters": {
    "type": "object",
    "properties": {
      "account_id": {
        "type": "string",
        "description": "User account ID"
      }
    },
    "required": ["account_id"]
  },
  "webhook_url": "https://api.example.com/webhook",  // for server tools
  "webhook_headers": {
    "Authorization": "Bearer xxx"
  }
}

# List Tools
GET /v1/convai/tools

# Update Tool
PUT /v1/convai/tools/{tool_id}

# Delete Tool
DELETE /v1/convai/tools/{tool_id}

# Get Dependent Agents
GET /v1/convai/tools/{tool_id}/dependent-agents
```

## 5. Testing & Quality Assurance

```bash
# Create Test
POST /v1/convai/tests
Body: {
  "name": "Customer greeting test",
  "agent_id": "agent_xxx",
  "test_cases": [
    {
      "input": "Hello",
      "expected_contains": ["help", "assist"],
      "expected_tool_calls": []
    }
  ]
}

# Run Tests on Agent
POST /v1/convai/agents/{agent_id}/run-tests
Body: {
  "test_ids": ["test_xxx", "test_yyy"]
}

# Get Test Results
GET /v1/convai/tests/invocations/{invocation_id}

# Get Test Summaries
GET /v1/convai/tests/summaries?agent_id={agent_id}
```

## 6. Webhooks & Callbacks

```bash
# Configure Post-Call Webhook
PUT /v1/convai/agents/{agent_id}
Body: {
  "platform_settings": {
    "webhooks": {
      "post_call_webhook": {
        "url": "https://api.example.com/call-ended",
        "headers": {
          "Authorization": "Bearer xxx"
        }
      }
    }
  }
}
```

### Webhook Payload

```typescript
interface PostCallWebhook {
  event: "conversation.ended";
  conversation_id: string;
  agent_id: string;
  duration_seconds: number;
  transcript: TranscriptTurn[];
  analysis?: {
    success_evaluation?: {
      score: number;
      criteria_met: string[];
      criteria_not_met: string[];
    };
    data_collection?: {
      fields: Record<string, any>;
    };
  };
  metadata: {
    start_time: string;
    end_time: string;
    user_ip?: string;
  };
}
```

## 7. Batch Operations

```bash
# Batch Call
POST /v1/convai/batch-calling
Body: {
  "agent_id": "agent_xxx",
  "phone_numbers": [
    {
      "phone_number": "+1234567890",
      "metadata": {
        "customer_id": "cust_123",
        "name": "John Doe"
      }
    }
  ],
  "scheduling": {
    "start_time": "09:00",
    "end_time": "17:00",
    "timezone": "America/New_York",
    "max_concurrent": 10
  }
}

# Get Batch Status
GET /v1/convai/batch-calling/{job_id}

# Cancel Batch
POST /v1/convai/batch-calling/{job_id}/cancel
```

## 8. Analytics & Monitoring

```bash
# Get Agent Analytics
GET /v1/convai/agents/{agent_id}/analytics?start_date=2024-01-01&end_date=2024-01-31
Response: {
  "total_conversations": 1250,
  "avg_duration_seconds": 180,
  "avg_latency_ms": {
    "tts_ttfb": 135,
    "stt_latency": 280,
    "llm_ttfb": 920
  },
  "success_rate": 0.89,
  "interruption_rate": 0.23,
  "tool_usage": {
    "get_balance": 450,
    "transfer_funds": 120
  }
}

# Get Workspace Dashboard
GET /v1/convai/workspace/dashboard
```

## 9. MCP (Model Context Protocol) Integration

```bash
# Create MCP Server
POST /v1/convai/mcp/servers
Body: {
  "name": "Custom Data Source",
  "url": "https://mcp.example.com",
  "api_key": "xxx",
  "tools": ["query_database", "update_record"]
}

# List MCP Servers
GET /v1/convai/mcp/servers

# Update Approval Policy
PUT /v1/convai/mcp/servers/{server_id}/approval-policy
Body: {
  "auto_approve": false,
  "approved_tools": ["query_database"]
}
```

## Rate Limits

- **Agent Operations**: 100 requests/minute
- **Conversation Operations**: 500 requests/minute
- **Knowledge Base**: 50 writes/minute, 200 reads/minute
- **Batch Operations**: 10 requests/minute
- **WebSocket Connections**: 1000 concurrent per workspace

## Error Handling

```typescript
interface APIError {
  error: {
    code: string;  // "AGENT_NOT_FOUND", "RATE_LIMIT_EXCEEDED", etc.
    message: string;
    details?: any;
  };
  status: number;
}
```

## SDK Support

- **JavaScript/TypeScript**: `@11labs/client`
- **Python**: `elevenlabs`
- **Go**: `github.com/elevenlabs/elevenlabs-go`
- **Java**: `io.github.elevenlabs:elevenlabs-java`

## Implementation Notes for Automagik Hello

1. **Agent Management**: Implement CRUD operations for agent configurations
2. **Versioning**: Support agent version snapshots for A/B testing
3. **Conversation Download**: Use GET `/v1/convai/conversations/{id}` for QA workflows
4. **Knowledge Base**: Enable RAG for context-aware responses
5. **Testing**: Automate quality checks with test suites
6. **Analytics**: Track performance metrics for optimization
7. **Webhooks**: Implement post-call analysis pipeline
8. **Batch Operations**: Support outbound campaign scenarios
