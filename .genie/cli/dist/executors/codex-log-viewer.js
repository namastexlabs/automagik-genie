"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSessionIdFromLog = readSessionIdFromLog;
exports.extractSessionIdFromContent = extractSessionIdFromContent;
exports.renderJsonlView = renderJsonlView;
const fs_1 = __importDefault(require("fs"));
function readSessionIdFromLog(logFile) {
    if (!logFile)
        return null;
    try {
        const content = fs_1.default.readFileSync(logFile, 'utf8');
        return extractSessionIdFromContent(content);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`⚠️ Failed to read log '${logFile}': ${message}`);
        return null;
    }
}
function extractSessionIdFromContent(content) {
    const lines = Array.isArray(content) ? content : String(content).split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const raw = lines[i];
        if (!raw)
            continue;
        const trimmed = raw.trim();
        if (!trimmed.startsWith('{'))
            continue;
        try {
            const parsed = JSON.parse(trimmed);
            if (!parsed || typeof parsed !== 'object')
                continue;
            const candidate = parsed.session_id ||
                parsed.sessionId ||
                (parsed.session && (parsed.session.id || parsed.session.session_id || parsed.session.sessionId)) ||
                (parsed.data && (parsed.data.session_id || parsed.data.sessionId));
            if (candidate)
                return candidate;
            if (parsed.type === 'session.created' && parsed.id) {
                return parsed.id;
            }
        }
        catch (error) {
            continue;
        }
    }
    return null;
}
function renderJsonlView(src, parsed, paths, store, save, formatPathRelative) {
    const { entry, jsonl, raw } = src;
    let meta = jsonl.find((e) => e.provider && e.model) || {};
    const promptObj = jsonl.find((e) => typeof e.prompt === 'string') || {};
    const prompt = promptObj.prompt || '';
    const lastN = parsed.options.lines && parsed.options.lines > 0 ? parsed.options.lines : 60;
    const byCall = new Map();
    const execs = [];
    const mcp = [];
    const patches = { add: 0, update: 0, move: 0, delete: 0 };
    const errs = [];
    const errorEvents = [];
    const reasoningItems = [];
    const assistantMessages = [];
    const toolCallItems = [];
    let tokenInfo = null;
    let rateLimits = null;
    let sessionIdFromEvents = null;
    jsonl.forEach((ev) => {
        if (!meta.model && ev.model && ev.provider) {
            meta = { ...meta, model: ev.model, provider: ev.provider, sandbox: ev.sandbox, workdir: ev.workdir };
        }
        const envelope = (ev && typeof ev === 'object') ? ev : {};
        const explicitType = envelope.type;
        if (explicitType === 'error') {
            const message = envelope.message || envelope.text || JSON.stringify(envelope);
            errorEvents.push(message);
            return;
        }
        if (explicitType === 'item.completed') {
            const item = envelope.item || {};
            const text = typeof item.text === 'string' ? item.text : '';
            switch (item.item_type) {
                case 'assistant_message':
                    if (text)
                        assistantMessages.push(text.trim());
                    break;
                case 'reasoning':
                    if (text)
                        reasoningItems.push(text.trim());
                    break;
                case 'tool_call':
                case 'tool_result':
                    toolCallItems.push({
                        id: item.id || null,
                        role: item.item_type,
                        text: text || JSON.stringify(item)
                    });
                    break;
                default:
                    if (text)
                        reasoningItems.push(`${item.item_type || 'item'}: ${text.trim()}`);
            }
            return;
        }
        const m = envelope.msg || envelope;
        const type = m && m.type;
        const info = envelope.info || m.info;
        const rate = envelope.rate_limits || m.rate_limits;
        if (type === 'session.created') {
            const found = m.session_id || m.sessionId || (m.session && (m.session.id || m.session.session_id || m.session.sessionId));
            if (found)
                sessionIdFromEvents = sessionIdFromEvents || found;
            if (m.model || m.provider || m.sandbox || (m.session && m.session.model)) {
                meta = {
                    ...meta,
                    ...(m.session || {}),
                    ...(typeof m.metadata === 'object' ? m.metadata : {}),
                };
                if (m.model)
                    meta.model = m.model;
                if (m.provider)
                    meta.provider = m.provider;
                if (m.sandbox)
                    meta.sandbox = m.sandbox;
                if (m.workdir)
                    meta.workdir = m.workdir;
                if (m.session && m.session.model && !meta.model)
                    meta.model = m.session.model;
                if (m.session && m.session.provider && !meta.provider)
                    meta.provider = m.session.provider;
            }
            return;
        }
        switch (type) {
            case 'exec_command_begin':
                byCall.set(m.call_id, { cmd: (m.command || []).join(' '), cwd: m.cwd });
                break;
            case 'exec_command_end': {
                const rec = byCall.get(m.call_id) || {};
                execs.push({ cmd: rec.cmd || '(unknown)', exit: m.exit_code, dur: m.duration });
                break;
            }
            case 'mcp_tool_call_begin':
                byCall.set(m.call_id, { mcp: { server: m.invocation?.server, tool: m.invocation?.tool } });
                break;
            case 'mcp_tool_call_end': {
                const rec = byCall.get(m.call_id) || { mcp: {} };
                const d = m.duration || {};
                mcp.push({ server: rec.mcp?.server || '?', tool: rec.mcp?.tool || '?', secs: d.secs || 0 });
                break;
            }
            case 'patch_apply_begin': {
                const changes = m.changes || {};
                Object.values(changes).forEach((chg) => {
                    if (chg.add)
                        patches.add += 1;
                    if (chg.update) {
                        patches.update += 1;
                        if (chg.update.move_path)
                            patches.move += 1;
                    }
                    if (chg.delete)
                        patches.delete += 1;
                });
                break;
            }
            case 'token_count': {
                if (info?.total_token_usage)
                    tokenInfo = info.total_token_usage;
                if (rate)
                    rateLimits = rate;
                break;
            }
            case 'token.usage': {
                if (m.input_tokens || m.output_tokens || m.total_tokens) {
                    tokenInfo = {
                        input_tokens: m.input_tokens,
                        output_tokens: m.output_tokens,
                        total_tokens: m.total_tokens || ((m.input_tokens || 0) + (m.output_tokens || 0))
                    };
                }
                break;
            }
            case 'response.usage': {
                const usage = envelope.usage || m.usage || m;
                if (usage) {
                    tokenInfo = {
                        input_tokens: usage.input_tokens || usage.prompt_tokens || 0,
                        output_tokens: usage.output_tokens || usage.completion_tokens || 0,
                        total_tokens: usage.total_tokens || usage.usage || ((usage.input_tokens || 0) + (usage.output_tokens || 0))
                    };
                }
                break;
            }
            case 'response.output_text.delta': {
                const responseId = envelope.response_id || m.response_id;
                if (!responseId)
                    break;
                const delta = envelope.delta || m.delta || '';
                if (!delta)
                    break;
                if (!assistantMessages._streamBuffer)
                    assistantMessages._streamBuffer = new Map();
                const buffer = assistantMessages._streamBuffer;
                const prev = buffer.get(responseId) || '';
                buffer.set(responseId, prev + delta);
                break;
            }
            case 'response.output_text.completed': {
                const responseId = envelope.response_id || m.response_id;
                if (responseId && assistantMessages._streamBuffer?.has(responseId)) {
                    const text = assistantMessages._streamBuffer.get(responseId)?.trim();
                    if (text)
                        assistantMessages.push(text);
                    assistantMessages._streamBuffer.delete(responseId);
                }
                break;
            }
            case 'response.completed': {
                if (assistantMessages._streamBuffer) {
                    const values = Array.from(assistantMessages._streamBuffer.values());
                    values.forEach((val) => {
                        const cleaned = (val || '').trim();
                        if (cleaned)
                            assistantMessages.push(cleaned);
                    });
                    assistantMessages._streamBuffer.clear();
                }
                break;
            }
            case 'response.refusal.delta': {
                const delta = envelope.delta || m.delta;
                if (delta)
                    reasoningItems.push(`refusal: ${delta}`);
                break;
            }
            default: {
                const s = JSON.stringify(m || envelope);
                if (/error/i.test(s))
                    errs.push(m);
            }
        }
    });
    if (sessionIdFromEvents && !entry.sessionId) {
        entry.sessionId = sessionIdFromEvents;
        save(paths, store);
    }
    if (assistantMessages._streamBuffer) {
        const bufferValues = Array.from(assistantMessages._streamBuffer.values() || []);
        bufferValues.forEach((val) => {
            const cleaned = (val || '').trim();
            if (cleaned)
                assistantMessages.push(cleaned);
        });
        assistantMessages._streamBuffer.clear();
        delete assistantMessages._streamBuffer;
    }
    console.log(`\nView: ${entry.agent} | session:${entry.sessionId || 'n/a'} | log:${formatPathRelative(entry.logFile, paths.baseDir)}`);
    if (meta.model) {
        console.log(`Model: ${meta.model} • Provider: ${meta.provider} • Sandbox: ${meta.sandbox || 'n/a'}`);
        if (meta.workdir)
            console.log(`Workdir: ${meta.workdir}`);
    }
    if (prompt) {
        console.log('\nPrompt:');
        console.log('  ' + prompt);
    }
    if (reasoningItems.length) {
        console.log(`\nReasoning (${reasoningItems.length}):`);
        reasoningItems.slice(-5).forEach((text) => {
            const lines = text.split(/\r?\n/);
            lines.forEach((line, idx) => {
                const prefix = idx === 0 ? '  • ' : '    ';
                console.log(prefix + line);
            });
        });
    }
    const finalAssistantMessages = assistantMessages.filter((msg) => typeof msg === 'string' && msg.trim().length);
    if (finalAssistantMessages.length) {
        console.log(`\nAssistant (${finalAssistantMessages.length}):`);
        finalAssistantMessages.slice(-3).forEach((msg) => {
            console.log('  • ' + msg.replace(/\s+/g, ' ').trim());
        });
    }
    if (toolCallItems.length) {
        console.log(`\nTool Items (${toolCallItems.length}):`);
        toolCallItems.slice(-5).forEach((item) => {
            const summary = item.text.length > 160 ? `${item.text.slice(0, 160)}…` : item.text;
            console.log(`  • ${item.role}${item.id ? `(${item.id})` : ''}: ${summary}`);
        });
    }
    if (mcp.length) {
        console.log(`\nMCP (${mcp.length}):`);
        mcp.slice(-5).forEach((c) => console.log(`  • ${c.server}:${c.tool} ${c.secs}s`));
    }
    if (patches.add || patches.update || patches.move || patches.delete) {
        console.log(`\nPatches: add:${patches.add} update:${patches.update} move:${patches.move} delete:${patches.delete}`);
    }
    if (execs.length) {
        console.log(`\nExecs (last ${Math.min(3, execs.length)}):`);
        execs.slice(-3).forEach((e) => {
            const ms = e.dur ? e.dur.secs * 1000 + Math.round((e.dur.nanos || 0) / 1e6) : null;
            console.log(`  ${e.exit === 0 ? 'OK ' : 'ERR'} ${e.cmd}  (${ms ?? '?'} ms)`);
        });
    }
    if (errs.length) {
        console.log('\nErrors (recent):');
        errs.slice(-5).forEach((e) => {
            const s = JSON.stringify(e).slice(0, 160);
            console.log('  ' + s + (s.length >= 160 ? '…' : ''));
        });
    }
    if (errorEvents.length) {
        console.log('\nStream Errors:');
        errorEvents.slice(-5).forEach((msg) => {
            const clipped = msg.length > 160 ? `${msg.slice(0, 160)}…` : msg;
            console.log('  ' + clipped);
        });
    }
    const okCount = execs.filter((e) => e.exit === 0).length;
    const errCount = execs.filter((e) => e.exit !== 0 && e.exit != null).length;
    console.log('\nStats:');
    const pad = (s, n) => (String(s || '') + ' '.repeat(n)).slice(0, n);
    console.log('  ' + pad('MCP', 16) + ` ${mcp.length}`);
    console.log('  ' + pad('Execs', 16) + ` total:${execs.length} ok:${okCount} err:${errCount}`);
    console.log('  ' + pad('Patches', 16) + ` add:${patches.add} update:${patches.update} move:${patches.move} delete:${patches.delete}`);
    if (finalAssistantMessages.length) {
        console.log('  ' + pad('Assistant', 16) + ` ${finalAssistantMessages.length}`);
    }
    if (reasoningItems.length) {
        console.log('  ' + pad('Reasoning', 16) + ` ${reasoningItems.length}`);
    }
    if (toolCallItems.length) {
        console.log('  ' + pad('Tool Items', 16) + ` ${toolCallItems.length}`);
    }
    if (tokenInfo) {
        const info = tokenInfo;
        console.log('  ' + pad('Tokens', 16) + ` in:${info.input_tokens ?? 0} out:${info.output_tokens ?? 0} total:${info.total_tokens ?? 0}`);
    }
    if (rateLimits?.primary) {
        console.log('  ' + pad('RateLimit', 16) + ` used:${rateLimits.primary.used_percent || 0}% reset:${rateLimits.primary.resets_in_seconds || 0}s`);
    }
    console.log(`\nRaw Tail (${lastN} lines):`);
    raw.split(/\r?\n/).slice(-lastN).forEach((l) => console.log('  ' + l));
}
exports.default = {
    readSessionIdFromLog,
    extractSessionIdFromContent,
    renderJsonlView
};
