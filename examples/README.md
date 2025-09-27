# Examples and Frontend Integration

This folder tracks demo frontends and integrations used to showcase the Automagik Hello real‑time socket.

## Swift (Next.js) — Submodule

We vend the excellent Swift UI as a git submodule under `examples/swift`:

```
git submodule update --init --recursive
```

Swift is a Next.js app with VAD and a streaming audio path. By default it uses Groq (ASR/LLM) and Cartesia (TTS).

### Run Swift standalone (baseline)
- Copy `examples/swift/.env.example` to `examples/swift/.env.local` and set `GROQ_API_KEY` and `CARTESIA_API_KEY`.
- From `examples/swift/`: `pnpm install && pnpm dev`

### Integrate with Automagik Hello (Agents WS clone)
Objective: showcase our WebSocket (ElevenLabs Agents WS‑compatible) without requiring Cartesia/Groq keys.

Approach (plan):
- Add a simple Agents WS client in Swift that connects directly to our server’s WS (no third‑party keys needed).
- Use the documented event types in `docs/research.md` (conversation_initiation_metadata, audio, agent_response, agent_response_correction, user_transcript; and client events contextual_update, user_message, user_activity).

Proposed environment variable (read by the UI):
- `NEXT_PUBLIC_VOICE_WS_URL` — e.g., `ws://localhost:8080/ws/agents` (to be provided by our Rust server)

Minimal client sketch (to be implemented inside Swift):
```
const ws = new WebSocket(process.env.NEXT_PUBLIC_VOICE_WS_URL!);
ws.onmessage = (e) => {
  const evt = JSON.parse(e.data);
  switch (evt.type) {
    case 'conversation_initiation_metadata': /* capture formats */ break;
    case 'audio': /* base64 → AudioWorklet buffer */ break;
    case 'agent_response': /* show text */ break;
    case 'agent_response_correction': /* update truncated text */ break;
    case 'user_transcript': /* append user text */ break;
  }
};
// Send client events when needed
// ws.send(JSON.stringify({ type: 'user_activity' }));
// ws.send(JSON.stringify({ type: 'user_message', text }));
// ws.send(JSON.stringify({ type: 'contextual_update', text }));
```

Audio playback: use an AudioWorklet/ScriptProcessor to decode base64 PCM or mp3 and append to a queue for smooth playback. The exact output codec will match the `conversation_initiation_metadata` formats.

### Why Swift?
- Solid VAD and UX scaffolding
- Easy to add a second path (Agents WS) alongside its existing Cartesia/Groq demo

### Next steps (once server exists)
1. Expose the WS endpoint from our server: `ws://localhost:8080/ws/agents` (ElevenLabs schema)
2. Add a small `lib/agents-ws-client.ts` in the submodule (or fork branch) and read `NEXT_PUBLIC_VOICE_WS_URL`
3. Map audio events to AudioWorklet; map text events to chat bubbles
4. Add a feature toggle in the UI (Cartesia/Groq vs Agents WS)

Notes
- We will not modify the submodule directly on `main`; integration changes should be kept in a local branch or documented patches.
- See `docs/research.md` for the event schema details and llms.txt evidence lines.
