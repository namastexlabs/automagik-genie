"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitView = void 0;
const view_1 = require("../view");
async function emitView(envelope, options, opts = {}) {
    const style = 'genie';
    const styledEnvelope = { ...envelope, style };
    await (0, view_1.renderEnvelope)(styledEnvelope, {
        json: opts.forceJson ?? false,
        stream: opts.stream,
        style
    });
}
exports.emitView = emitView;
