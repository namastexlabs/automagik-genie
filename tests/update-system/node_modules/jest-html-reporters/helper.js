"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterSkipTests = exports.deepClone = exports.replaceRootDirVariable = exports.copyAndReplace = exports.getOptions = exports.readAttachInfos = exports.addMsg = exports.addAttach = exports.resourceDirName = exports.attachDirPath = exports.dataDirPath = exports.tempDirPath = void 0;
var fs_extra_1 = __importDefault(require("fs-extra"));
var os_1 = __importDefault(require("os"));
var path_1 = __importDefault(require("path"));
var username = '';
try {
    username = os_1.default.userInfo().username;
}
catch (err) {
    console.log(err);
}
exports.tempDirPath = path_1.default.resolve(process.env.JEST_HTML_REPORTERS_TEMP_DIR_PATH || os_1.default.tmpdir(), "".concat(username, "-").concat(Buffer.from(process.cwd()).toString('base64')), 'jest-html-reporters-temp');
exports.dataDirPath = path_1.default.resolve(exports.tempDirPath, './data');
exports.attachDirPath = path_1.default.resolve(exports.tempDirPath, './images');
exports.resourceDirName = './jest-html-reporters-attach';
var addAttach = function (_a) {
    var attach = _a.attach, descriptionRaw = _a.description, context = _a.context, _b = _a.bufferFormat, bufferFormat = _b === void 0 ? 'jpg' : _b;
    return __awaiter(void 0, void 0, void 0, function () {
        var description, _c, testPath, testName, createTime, fileName, attachObject, path_2, attachObject, err_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    description = getSerializableContent(descriptionRaw);
                    _c = getJestGlobalData(context), testPath = _c.testPath, testName = _c.testName;
                    // type check
                    if (typeof attach !== 'string' && !Buffer.isBuffer(attach)) {
                        console.error("[jest-html-reporters]: Param attach error, not a buffer or string, pic ".concat(testName, " - ").concat(description, " log failed."));
                        return [2 /*return*/];
                    }
                    createTime = Date.now();
                    fileName = generateRandomString();
                    if (!(typeof attach === 'string')) return [3 /*break*/, 2];
                    attachObject = {
                        createTime: createTime,
                        testPath: testPath,
                        testName: testName,
                        filePath: attach,
                        description: description,
                        extName: path_1.default.extname(attach),
                    };
                    return [4 /*yield*/, fs_extra_1.default.writeJSON("".concat(exports.dataDirPath, "/").concat(fileName, ".json"), attachObject)];
                case 1:
                    _d.sent();
                    _d.label = 2;
                case 2:
                    if (!Buffer.isBuffer(attach)) return [3 /*break*/, 7];
                    path_2 = "".concat(exports.attachDirPath, "/").concat(fileName, ".").concat(bufferFormat);
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, fs_extra_1.default.writeFile(path_2, attach)];
                case 4:
                    _d.sent();
                    attachObject = {
                        createTime: createTime,
                        testPath: testPath,
                        testName: testName,
                        fileName: "".concat(fileName, ".").concat(bufferFormat),
                        description: description,
                        extName: ".".concat(bufferFormat),
                    };
                    return [4 /*yield*/, fs_extra_1.default.writeJSON("".concat(exports.dataDirPath, "/").concat(fileName, ".json"), attachObject)];
                case 5:
                    _d.sent();
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _d.sent();
                    console.error(err_1);
                    console.error("[jest-html-reporters]: Param attach error, can not save as a image, pic ".concat(testName, " - ").concat(description, " log failed."));
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
};
exports.addAttach = addAttach;
/**
 *
 * @param {string} message
 * @param {object} context. Optional. It contains custom configs
 */
var addMsg = function (_a) {
    var message = _a.message, context = _a.context;
    return __awaiter(void 0, void 0, void 0, function () {
        var description, _b, testPath, testName, createTime, fileName, attachObject;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    description = getSerializableContent(message);
                    _b = getJestGlobalData(context), testPath = _b.testPath, testName = _b.testName;
                    createTime = Date.now();
                    fileName = generateRandomString();
                    attachObject = {
                        createTime: createTime,
                        testPath: testPath,
                        testName: testName,
                        description: description,
                    };
                    return [4 /*yield*/, fs_extra_1.default.writeJSON("".concat(exports.dataDirPath, "/").concat(fileName, ".json"), attachObject)];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
};
exports.addMsg = addMsg;
var getJestGlobalData = function (globalContext) {
    var testPath = '';
    var currentTestName = '';
    var context = globalContext || global;
    __spreadArray([], Object.getOwnPropertySymbols(context), true).forEach(function (key) {
        if (context[key] && context[key].state && context[key].matchers) {
            var state = context[key].state || {};
            testPath = state.testPath;
            currentTestName = state.currentTestName;
        }
    });
    return { testPath: testPath, testName: currentTestName };
};
var generateRandomString = function () { return "".concat(Date.now()).concat(Math.random()); };
var readAttachInfos = function (publicPath, publicRelativePath) { return __awaiter(void 0, void 0, void 0, function () {
    var result, exist, attachData, dataList, attachFiles, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                result = {};
                _a.label = 1;
            case 1:
                _a.trys.push([1, 8, , 9]);
                return [4 /*yield*/, fs_extra_1.default.pathExists(exports.dataDirPath)];
            case 2:
                exist = _a.sent();
                if (!exist) {
                    console.info('Temp folder not exist, means that attach Infos may append unsuccessful');
                    return [2 /*return*/, result];
                }
                return [4 /*yield*/, fs_extra_1.default.readdir(exports.dataDirPath)];
            case 3:
                attachData = _a.sent();
                return [4 /*yield*/, Promise.all(attachData.map(function (data) {
                        return fs_extra_1.default.readJSON("".concat(exports.dataDirPath, "/").concat(data), { throws: false });
                    }))];
            case 4:
                dataList = _a.sent();
                return [4 /*yield*/, fs_extra_1.default.readdir(exports.attachDirPath)];
            case 5:
                attachFiles = _a.sent();
                if (!attachFiles.length) return [3 /*break*/, 7];
                result.hasAttachFiles = true;
                return [4 /*yield*/, fs_extra_1.default.copy(exports.attachDirPath, publicPath)];
            case 6:
                _a.sent();
                _a.label = 7;
            case 7:
                dataList.forEach(function (attachObject) {
                    if (!attachObject)
                        return;
                    var testPath = attachObject.testPath, testName = attachObject.testName, filePath = attachObject.filePath, description = attachObject.description, fileName = attachObject.fileName, createTime = attachObject.createTime, extName = attachObject.extName;
                    var attachMappingName = testName || 'jest-html-reporters-file-attach';
                    if (!result[testPath])
                        result[testPath] = {};
                    if (!result[testPath][attachMappingName]) {
                        result[testPath][attachMappingName] = [];
                    }
                    result[testPath][attachMappingName].push({
                        filePath: fileName ? "".concat(publicRelativePath, "/").concat(fileName) : filePath,
                        description: description || '',
                        createTime: createTime,
                        extName: extName,
                    });
                });
                return [3 /*break*/, 9];
            case 8:
                err_2 = _a.sent();
                console.error(err_2);
                console.error('[jest-html-reporters]: parse attach failed!');
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/, result];
        }
    });
}); };
exports.readAttachInfos = readAttachInfos;
// For options
var PUBLIC_PATH = 'publicPath';
var FILE_NAME = 'filename';
var EXPAND = 'expand';
var PAGE_TITLE = 'pageTitle';
var LOGO_IMG_PATH = 'logoImgPath';
var HIDE_ICON = 'hideIcon';
var CUSTOM_INFOS = 'customInfos';
var TEST_COMMAND = 'testCommand';
var OPEN_REPORT = 'openReport';
var FAILURE_MESSAGE_ONLY = 'failureMessageOnly';
var ENABLE_MERGE_DATA = 'enableMergeData';
var DATA_MERGE_LEVEL = 'dataMergeLevel';
var INLINE_SOURCE = 'inlineSource';
var URL_FOR_TEST_FILES = 'urlForTestFiles';
var DARK_THEME = 'darkTheme';
var INCLUDE_CONSOLE_LOG = 'includeConsoleLog';
var STRIP_SKIPPED_TEST = 'stripSkippedTest';
var constants = {
    ENVIRONMENT_CONFIG_MAP: {
        JEST_HTML_REPORTERS_PUBLIC_PATH: PUBLIC_PATH,
        JEST_HTML_REPORTERS_FILE_NAME: FILE_NAME,
        JEST_HTML_REPORTERS_EXPAND: EXPAND,
        JEST_HTML_REPORTERS_PAGE_TITLE: PAGE_TITLE,
        JEST_HTML_REPORTERS_LOGO_IMG_PATH: LOGO_IMG_PATH,
        JEST_HTML_REPORTERS_HIDE_ICON: HIDE_ICON,
        JEST_HTML_REPORTERS_CUSTOM_INFOS: CUSTOM_INFOS,
        JEST_HTML_REPORTERS_TEST_COMMAND: TEST_COMMAND,
        JEST_HTML_REPORTERS_OPEN_REPORT: OPEN_REPORT,
        JEST_HTML_REPORTERS_FAILURE_MESSAGE_ONLY: FAILURE_MESSAGE_ONLY,
        JEST_HTML_REPORTERS_ENABLE_MERGE_DATA: ENABLE_MERGE_DATA,
        JEST_HTML_REPORTERS_DATA_MERGE_LEVEL: DATA_MERGE_LEVEL,
        JEST_HTML_REPORTERS_INLINE_SOURCE: INLINE_SOURCE,
        JEST_HTML_REPORTERS_URL_FOR_TEST_FILES: URL_FOR_TEST_FILES,
        JEST_HTML_REPORTERS_DARK_THEME: DARK_THEME,
        JEST_HTML_REPORTERS_INCLUDE_CONSOLE_LOG: INCLUDE_CONSOLE_LOG,
        JEST_HTML_REPORTERS_STRIP_SKIPPED_TEST: STRIP_SKIPPED_TEST,
    },
    DEFAULT_OPTIONS: (_a = {},
        _a[PUBLIC_PATH] = process.cwd(),
        _a[FILE_NAME] = 'jest_html_reporters.html',
        _a[EXPAND] = false,
        _a[PAGE_TITLE] = '',
        _a[LOGO_IMG_PATH] = undefined,
        _a[HIDE_ICON] = false,
        _a[CUSTOM_INFOS] = undefined,
        _a[TEST_COMMAND] = '',
        _a[OPEN_REPORT] = process.env.NODE_ENV === 'development',
        _a[FAILURE_MESSAGE_ONLY] = 0,
        _a[ENABLE_MERGE_DATA] = false,
        _a[DATA_MERGE_LEVEL] = 1,
        _a[INLINE_SOURCE] = false,
        _a[URL_FOR_TEST_FILES] = '',
        _a[DARK_THEME] = false,
        _a[INCLUDE_CONSOLE_LOG] = false,
        _a[STRIP_SKIPPED_TEST] = false,
        _a),
};
function getEnvOptions() {
    var options = {};
    for (var name_1 in constants.ENVIRONMENT_CONFIG_MAP) {
        if (process.env[name_1]) {
            options[constants.ENVIRONMENT_CONFIG_MAP[name_1]] = process.env[name_1];
        }
    }
    return options;
}
var getOptions = function (reporterOptions) {
    if (reporterOptions === void 0) { reporterOptions = {}; }
    return Object.assign({}, constants.DEFAULT_OPTIONS, reporterOptions, getEnvOptions());
};
exports.getOptions = getOptions;
var copyAndReplace = function (_a) {
    var tmpPath = _a.tmpPath, outPutPath = _a.outPutPath, pattern = _a.pattern, newSubstr = _a.newSubstr;
    var data = fs_extra_1.default.readFileSync(tmpPath, { encoding: 'utf8' });
    var res = data.replace(pattern, function () { return newSubstr; });
    fs_extra_1.default.writeFileSync(outPutPath, res);
};
exports.copyAndReplace = copyAndReplace;
var rootDirVariable = '<rootDir>';
var replaceRootDirVariable = function (publicPath, rootDirPath) {
    if (!publicPath.startsWith(rootDirVariable)) {
        return publicPath;
    }
    return publicPath.replace(rootDirVariable, rootDirPath);
};
exports.replaceRootDirVariable = replaceRootDirVariable;
var usingStructure = {
    keys: [
        'numFailedTestSuites',
        'numFailedTests',
        'numPassedTestSuites',
        'numPassedTests',
        'numPendingTestSuites',
        'numPendingTests',
        'numRuntimeErrorTestSuites',
        'numTodoTests',
        'numTotalTestSuites',
        'numTotalTests',
        'startTime',
        'success',
        [
            'testResults',
            {
                keys: [
                    'numFailingTests',
                    'numPassingTests',
                    'numPendingTests',
                    'numTodoTests',
                    'perfStats',
                    'testFilePath',
                    'failureMessage',
                    [
                        'testResults',
                        {
                            keys: [
                                'ancestorTitles',
                                'duration',
                                'failureMessages',
                                'fullName',
                                'status',
                                'title',
                            ],
                        },
                    ],
                ],
            },
        ],
    ],
};
var basisClone = function (obj, structure) {
    if (typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(function (item) { return basisClone(item, structure); });
    }
    var keys = structure.keys;
    var res = {};
    keys.forEach(function (item) {
        if (typeof item === 'string') {
            res[item] = obj[item];
        }
        else {
            var key = item[0], innerStructure = item[1];
            res[key] = basisClone(obj[key], innerStructure);
        }
    });
    return res;
};
var deepClone = function (obj) {
    var res = basisClone(obj, usingStructure);
    return JSON.parse(JSON.stringify(res));
};
exports.deepClone = deepClone;
var getSerializableContent = function (content) {
    if (typeof content === 'string')
        return content;
    return JSON.stringify(content, null, 2);
};
var filterSkipTests = function (obj) {
    obj.testResults.forEach(function (item) {
        item.numPendingTests = 0;
        item.testResults = item.testResults.filter(function (test) { return !(test.status === 'skipped' || test.status === 'pending'); });
    });
    var countTotalTests = 0;
    obj.testResults = obj.testResults.filter(function (i) {
        var notSkipped = !(i.skipped || i.testResults.length === 0);
        if (notSkipped) {
            countTotalTests += i.testResults.length;
        }
        return notSkipped;
    });
    obj.numTotalTests = countTotalTests;
    obj.numTotalTestSuites = obj.testResults.length;
    obj.numPendingTestSuites = 0;
    obj.numPendingTests = 0;
    return obj;
};
exports.filterSkipTests = filterSkipTests;
