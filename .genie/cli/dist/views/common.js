"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInfoView = exports.buildWarningView = exports.buildErrorView = void 0;
const GENIE_STYLE = 'genie';
function buildErrorView(title, message) {
    return {
        style: GENIE_STYLE,
        title,
        body: {
            type: 'callout',
            tone: 'danger',
            icon: '❌',
            title,
            body: [message]
        }
    };
}
exports.buildErrorView = buildErrorView;
function buildWarningView(title, messages) {
    return {
        style: GENIE_STYLE,
        title,
        body: {
            type: 'callout',
            tone: 'warning',
            icon: '⚠️',
            title,
            body: messages
        }
    };
}
exports.buildWarningView = buildWarningView;
function buildInfoView(title, messages) {
    return {
        style: GENIE_STYLE,
        title,
        body: {
            type: 'callout',
            tone: 'info',
            icon: 'ℹ️',
            title,
            body: messages
        }
    };
}
exports.buildInfoView = buildInfoView;
