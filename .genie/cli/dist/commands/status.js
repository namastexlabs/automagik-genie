"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStatus = void 0;
const view_helpers_1 = require("../lib/view-helpers");
const common_1 = require("../views/common");
async function runStatus(parsed, _config, _paths) {
    const messages = [
        'The legacy `status` command is deprecated.',
        'Use `genie update --status` (coming soon) or consult the migration guide for current workflows.',
        'Documentation: https://github.com/namastexlabs/automagik-genie/docs/migration-guide.md'
    ];
    await (0, view_helpers_1.emitView)((0, common_1.buildInfoView)('Status command deprecated', messages), parsed.options);
}
exports.runStatus = runStatus;
