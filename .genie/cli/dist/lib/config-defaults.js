"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultConfig = exports.DEFAULT_CONFIG = void 0;
const config_1 = require("./config");
exports.DEFAULT_CONFIG = (0, config_1.buildDefaultConfig)();
function getDefaultConfig() {
    return exports.DEFAULT_CONFIG;
}
exports.getDefaultConfig = getDefaultConfig;
