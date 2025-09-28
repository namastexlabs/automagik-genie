"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEnvelope = renderEnvelope;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const gradient_string_1 = __importDefault(require("gradient-string"));
const theme_1 = require("./theme");
let inkModule = null;
async function ensureInk() {
    if (!inkModule) {
        inkModule = await import('ink');
    }
    return inkModule;
}
function useInk() {
    if (!inkModule) {
        throw new Error('Ink module not loaded');
    }
    return inkModule;
}
async function renderEnvelope(envelope, options = {}) {
    const targetStream = options.stream ?? process.stdout;
    const finalStyle = options.style ?? envelope.style ?? 'compact';
    if (options.json) {
        const payload = JSON.stringify(envelope, null, 2);
        targetStream.write(payload + '\n');
        return { text: payload };
    }
    const { render: inkRender } = await ensureInk();
    const instance = inkRender((0, jsx_runtime_1.jsx)(EnvelopeRoot, { envelope: envelope, style: finalStyle }), {
        stdout: targetStream,
        stderr: options.stream === process.stderr ? process.stderr : undefined,
        exitOnCtrlC: false
    });
    await instance.waitUntilExit();
    return {};
}
function EnvelopeRoot({ envelope, style }) {
    const { Box: InkBox } = useInk();
    return ((0, jsx_runtime_1.jsx)(InkBox, { flexDirection: "column", children: renderNode(envelope.body, style) }));
}
function renderNode(node, style, keyPrefix = 'node') {
    switch (node.type) {
        case 'layout':
            return renderLayoutNode(node, style, keyPrefix);
        case 'heading':
            return renderHeadingNode(node, style);
        case 'text':
            return renderTextNode(node);
        case 'keyValue':
            return renderKeyValueNode(node);
        case 'table':
            return renderTableNode(node);
        case 'divider':
            return renderDividerNode(node);
        case 'callout':
            return renderCalloutNode(node);
        case 'list':
            return renderListNode(node);
        case 'badge':
            return renderBadgeNode(node);
        case 'log':
            return renderLogNode(node);
        case 'timeline':
            return renderTimelineNode(node);
        case 'space': {
            const { Text: InkText } = useInk();
            return (0, jsx_runtime_1.jsx)(InkText, { children: '\n'.repeat(Math.max(0, node.size)) }, `${keyPrefix}-space`);
        }
        default:
            return null;
    }
}
function renderLayoutNode(node, style, keyPrefix) {
    const { Box: InkBox, Text: InkText } = useInk();
    const direction = node.direction ?? 'column';
    const padding = node.padding ?? [0, 0, 0, 0];
    const children = [];
    node.children.forEach((child, index) => {
        const key = `${keyPrefix}-${index}`;
        children.push((0, jsx_runtime_1.jsxs)(react_1.Fragment, { children: [renderNode(child, style, key), index < node.children.length - 1 && node.gap ? gapSpacer(direction, node.gap, key) : null] }, key));
    });
    return ((0, jsx_runtime_1.jsx)(InkBox, { flexDirection: direction, paddingTop: padding[0], paddingRight: padding[1], paddingBottom: padding[2], paddingLeft: padding[3], alignItems: node.alignItems, justifyContent: node.justifyContent, children: children }));
}
function gapSpacer(direction, size, key) {
    const { Text: InkText } = useInk();
    if (direction === 'column') {
        return (0, jsx_runtime_1.jsx)(InkText, { children: '\n'.repeat(size) }, `${key}-gap`);
    }
    return (0, jsx_runtime_1.jsx)(InkText, { children: ' '.repeat(size) }, `${key}-gap`);
}
function renderHeadingNode(node, style) {
    const { Box: InkBox, Text: InkText } = useInk();
    const color = (0, theme_1.accentToColor)(node.accent);
    if (node.level === 1 && (0, theme_1.isArtStyle)(style)) {
        const text = (0, gradient_string_1.default)([theme_1.palette.accent.primary, theme_1.palette.accent.secondary])(node.text);
        return ((0, jsx_runtime_1.jsx)(InkBox, { flexDirection: "column", alignItems: node.align === 'center' ? 'center' : 'flex-start', children: (0, jsx_runtime_1.jsx)(InkText, { children: text }) }));
    }
    const levelStyles = {
        1: { bold: true },
        2: { bold: true },
        3: { bold: false }
    };
    const styleInfo = levelStyles[node.level];
    const textContent = styleInfo.uppercase ? node.text.toUpperCase() : node.text;
    return ((0, jsx_runtime_1.jsx)(InkBox, { justifyContent: node.align === 'center' ? 'center' : 'flex-start', children: (0, jsx_runtime_1.jsx)(InkText, { color: color, bold: styleInfo.bold, children: textContent }) }));
}
function renderTextNode(node) {
    const { Text: InkText } = useInk();
    const color = (0, theme_1.toneToColor)(node.tone ?? 'default');
    return ((0, jsx_runtime_1.jsx)(InkText, { color: color, dimColor: node.dim, italic: node.italic, children: node.text }));
}
function renderKeyValueNode(node) {
    const { Box: InkBox, Text: InkText } = useInk();
    const columnsPerRow = node.columns ?? 1;
    const rows = [];
    node.items.forEach((item, index) => {
        const rowIndex = Math.floor(index / columnsPerRow);
        if (!rows[rowIndex])
            rows[rowIndex] = [];
        rows[rowIndex].push(item);
    });
    const labelWidth = node.items.length ? Math.max(...node.items.map((item) => item.label.length)) : 0;
    return ((0, jsx_runtime_1.jsx)(InkBox, { flexDirection: "column", children: rows.map((row, idx) => ((0, jsx_runtime_1.jsx)(InkBox, { flexDirection: "row", children: row.map((item, colIndex) => ((0, jsx_runtime_1.jsxs)(InkBox, { flexDirection: "row", marginRight: 4, children: [(0, jsx_runtime_1.jsx)(InkText, { color: theme_1.palette.accent.muted, children: item.label.padEnd(labelWidth) }), (0, jsx_runtime_1.jsx)(InkText, { color: (0, theme_1.toneToColor)(item.tone ?? 'default'), dimColor: item.dim, children: '  ' + item.value })] }, `kv-${idx}-${colIndex}`))) }, `kv-row-${idx}`))) }));
}
function renderTableNode(node) {
    const { Box: InkBox, Text: InkText } = useInk();
    const columns = node.columns;
    const widths = columns.map((col) => Math.max(col.label.length, col.width ?? 0));
    node.rows.forEach((row) => {
        columns.forEach((col, idx) => {
            const value = row[col.key] ?? '';
            widths[idx] = Math.max(widths[idx], value.length);
        });
    });
    const renderRow = (row, isHeader = false) => ((0, jsx_runtime_1.jsxs)(InkText, { children: [' ', columns
                .map((col, idx) => {
                const raw = isHeader ? col.label : row[col.key] ?? '';
                const width = widths[idx];
                const aligned = alignCell(raw, width, col.align ?? 'left');
                return aligned;
            })
                .join(' │ ')] }));
    const borderTop = '┌' + widths.map((w) => '─'.repeat(w + 2)).join('┬') + '┐';
    const borderMid = '├' + widths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤';
    const borderBottom = '└' + widths.map((w) => '─'.repeat(w + 2)).join('┴') + '┘';
    return ((0, jsx_runtime_1.jsxs)(InkBox, { flexDirection: "column", children: [(0, jsx_runtime_1.jsx)(InkText, { children: borderTop }), renderRow(Object.fromEntries(columns.map((c) => [c.key, c.label])), true), (0, jsx_runtime_1.jsx)(InkText, { children: borderMid }), node.rows.length === 0 && node.emptyText ? ((0, jsx_runtime_1.jsx)(InkText, { color: theme_1.palette.foreground.placeholder, children: ` ${node.emptyText}` })) : (node.rows.map((row, idx) => (0, jsx_runtime_1.jsx)(react_1.Fragment, { children: renderRow(row) }, `row-${idx}`))), (0, jsx_runtime_1.jsx)(InkText, { children: borderBottom })] }));
}
function alignCell(text, width, align) {
    if (align === 'right')
        return text.padStart(width);
    if (align === 'center') {
        const left = Math.floor((width - text.length) / 2);
        const right = width - text.length - left;
        return ' '.repeat(left) + text + ' '.repeat(right);
    }
    return text.padEnd(width);
}
function renderDividerNode(node) {
    const { Text: InkText } = useInk();
    const variant = node.variant ?? 'solid';
    const accentColor = (0, theme_1.accentToColor)(node.accent ?? 'muted');
    const char = variant === 'double' ? '═' : variant === 'dashed' ? '┄' : '─';
    return ((0, jsx_runtime_1.jsx)(InkText, { color: accentColor, children: char.repeat(72) }));
}
function renderCalloutNode(node) {
    const { Box: InkBox, Text: InkText } = useInk();
    const toneColor = (0, theme_1.toneToColor)(node.tone);
    const icon = node.icon || deriveCalloutIcon(node.tone);
    const border = node.tone === 'danger' ? 'double' : 'round';
    return ((0, jsx_runtime_1.jsxs)(InkBox, { flexDirection: "column", borderStyle: border, borderColor: toneColor, paddingX: 1, paddingY: 0, children: [node.title ? ((0, jsx_runtime_1.jsxs)(InkText, { color: toneColor, bold: true, children: [icon ? `${icon} ` : '', node.title] })) : null, node.body.map((line, idx) => ((0, jsx_runtime_1.jsx)(InkText, { color: theme_1.palette.foreground.default, children: line }, `callout-line-${idx}`)))] }));
}
function deriveCalloutIcon(tone) {
    switch (tone) {
        case 'success':
            return '✅';
        case 'warning':
            return '⚠️';
        case 'danger':
            return '❌';
        case 'info':
        default:
            return 'ℹ️';
    }
}
function renderListNode(node) {
    const { Box: InkBox, Text: InkText } = useInk();
    return ((0, jsx_runtime_1.jsx)(InkBox, { flexDirection: "column", children: node.items.map((item, idx) => ((0, jsx_runtime_1.jsx)(InkText, { color: (0, theme_1.toneToColor)(node.tone ?? 'default'), children: node.ordered ? `${idx + 1}. ${item}` : `• ${item}` }, `list-${idx}`))) }));
}
function renderBadgeNode(node) {
    const { Box: InkBox, Text: InkText } = useInk();
    const color = (0, theme_1.toneToColor)(node.tone === 'muted' ? 'muted' : node.tone);
    return ((0, jsx_runtime_1.jsx)(InkBox, { borderStyle: "round", borderColor: color, paddingX: 1, paddingY: 0, children: (0, jsx_runtime_1.jsx)(InkText, { color: color, children: node.text }) }));
}
function renderLogNode(node) {
    const { Box: InkBox, Text: InkText } = useInk();
    const lines = node.maxLines ? node.lines.slice(-node.maxLines) : node.lines;
    return ((0, jsx_runtime_1.jsx)(InkBox, { flexDirection: "column", children: lines.map((line, idx) => ((0, jsx_runtime_1.jsx)(InkText, { color: (0, theme_1.toneToColor)(line.tone ?? 'default'), bold: line.emphasis, children: line.text }, `log-${idx}`))) }));
}
function renderTimelineNode(node) {
    const { Box: InkBox, Text: InkText } = useInk();
    return ((0, jsx_runtime_1.jsx)(InkBox, { flexDirection: "column", children: node.items.map((item, idx) => {
            const isLast = idx === node.items.length - 1;
            const statusIcon = resolveTimelineIcon(item.status);
            return ((0, jsx_runtime_1.jsxs)(InkBox, { flexDirection: "row", children: [(0, jsx_runtime_1.jsxs)(InkBox, { flexDirection: "column", marginRight: 1, children: [(0, jsx_runtime_1.jsx)(InkText, { children: statusIcon }), !isLast ? (0, jsx_runtime_1.jsx)(InkText, { children: "\u2502" }) : (0, jsx_runtime_1.jsx)(InkText, { children: " " })] }), (0, jsx_runtime_1.jsxs)(InkBox, { flexDirection: "column", children: [(0, jsx_runtime_1.jsx)(InkText, { color: theme_1.palette.foreground.default, bold: true, children: item.title }), item.subtitle ? ((0, jsx_runtime_1.jsx)(InkText, { color: theme_1.palette.foreground.muted, children: item.subtitle })) : null, item.meta ? ((0, jsx_runtime_1.jsx)(InkText, { color: theme_1.palette.foreground.placeholder, children: item.meta })) : null] })] }, `timeline-${idx}`));
        }) }));
}
function resolveTimelineIcon(status) {
    switch (status) {
        case 'done':
            return '●';
        case 'failed':
            return '✖';
        case 'pending':
        default:
            return '○';
    }
}
