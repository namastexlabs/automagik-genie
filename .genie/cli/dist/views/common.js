"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildErrorView = buildErrorView;
exports.buildWarningView = buildWarningView;
exports.buildInfoView = buildInfoView;
function buildErrorView(style, title, message) {
    return {
        style,
        title,
        body: {
            type: 'callout',
            tone: 'danger',
            title,
            body: [message]
        }
    };
}
function buildWarningView(style, title, messages) {
    return {
        style,
        title,
        body: {
            type: 'callout',
            tone: 'warning',
            title,
            body: messages
        }
    };
}
function buildInfoView(style, title, messages) {
    return {
        style,
        title,
        body: {
            type: 'callout',
            tone: 'info',
            title,
            body: messages
        }
    };
}
