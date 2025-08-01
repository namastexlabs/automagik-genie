"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var open_1 = __importDefault(require("open"));
var path_1 = __importDefault(require("path"));
var helper_1 = require("./helper");
var localTemplateHTMLPath = path_1.default.resolve(__dirname, './dist/index.html');
var localTemplateSingleHTMLPath = path_1.default.resolve(__dirname, './dist/singleFile.html');
var localTemplateJSPath = path_1.default.resolve(__dirname, './dist/index.js');
var packageReplaceReg = /<<<JEST-HTML-REPLACE-PLACEHOLDER>>>/g;
var packageSingleReplaceReg = /&JEST-HTML-REPLACE-Single-PLACEHOLDER&/g;
function mkdirs(dirPath) {
    if (!fs_1.default.existsSync(path_1.default.dirname(dirPath))) {
        mkdirs(path_1.default.dirname(dirPath));
    }
    fs_1.default.mkdirSync(dirPath);
}
function imgToBase64(imgPath) {
    var fileName = path_1.default.resolve(imgPath);
    if (fs_1.default.statSync(fileName).isFile()) {
        var fileMimeType = path_1.default.extname(imgPath).toLowerCase();
        var fileData = fs_1.default.readFileSync(fileName).toString('base64');
        return "data:image/".concat(fileMimeType === 'svg' ? 'svg+xml' : fileMimeType, ";base64,").concat(fileData);
    }
    return undefined;
}
// for #32
var formatCustomInfo = function (customInfos) {
    if (typeof customInfos !== 'string')
        return customInfos;
    try {
        var infos = JSON.parse(customInfos);
        if (infos) {
            return Object.entries(infos).map(function (_a) {
                var key = _a[0], value = _a[1];
                return ({
                    title: key,
                    value: value,
                });
            });
        }
    }
    catch (err) {
        console.warn('the value of Custom info env must be a json string point to an Object', err);
    }
    return undefined;
};
var filenameErrorWordings = "\njest-html-reporters error: \n    config error for \u3010filename\u3011option!\n    this config just for filename, should not including the char */*\n    if you want put out report result to specific path,\n    please using \u3010publicPath\u3011. \n";
// my-custom-reporter.js
var MyCustomReporter = /** @class */ (function () {
    function MyCustomReporter(globalConfig, options) {
        this._logInfoMapping = {};
        var _a = options.filename, filename = _a === void 0 ? '' : _a;
        if (filename.includes('/')) {
            throw new Error(filenameErrorWordings);
        }
        this._globalConfig = __assign({}, globalConfig);
        this._options = (0, helper_1.getOptions)(options);
        this._options.publicPath = (0, helper_1.replaceRootDirVariable)(this._options.publicPath, globalConfig.rootDir);
        this._resourceRelativePath = "".concat(helper_1.resourceDirName, "/").concat(path_1.default.basename(this._options.filename, '.html'));
        this._publishResourceDir = path_1.default.resolve(this._options.publicPath, this._resourceRelativePath);
        this.init();
    }
    MyCustomReporter.prototype.onTestResult = function (data, result) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // add console logs per test only when Jest is run with verbose=false
                if (this._options.includeConsoleLog && result.console) {
                    this._logInfoMapping[result.testFilePath] = result.console;
                }
                return [2 /*return*/];
            });
        });
    };
    MyCustomReporter.prototype.onRunComplete = function (contexts, originalResults) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _a, publicPath, filename, logoImgPath, customInfos, openReport, failureMessageOnly, stripSkippedTest, logoImg, attachInfos, openIfRequested, data, filePath;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        results = (0, helper_1.deepClone)(originalResults);
                        _a = this._options, publicPath = _a.publicPath, filename = _a.filename, logoImgPath = _a.logoImgPath, customInfos = _a.customInfos, openReport = _a.openReport, failureMessageOnly = _a.failureMessageOnly, stripSkippedTest = _a.stripSkippedTest;
                        logoImg = logoImgPath ? imgToBase64(logoImgPath) : undefined;
                        results.config = this._globalConfig;
                        results.endTime = Date.now();
                        results._reporterOptions = __assign(__assign({}, this._options), { logoImg: logoImg, customInfos: formatCustomInfo(customInfos) });
                        results.logInfoMapping = this._logInfoMapping;
                        return [4 /*yield*/, (0, helper_1.readAttachInfos)(this._publishResourceDir, this._resourceRelativePath)];
                    case 1:
                        attachInfos = _b.sent();
                        openIfRequested = function (filePath) {
                            if (openReport) {
                                (0, open_1.default)(filePath, openReport === true ? {} : openReport);
                            }
                        };
                        results.attachInfos = attachInfos;
                        fs_1.default.existsSync(publicPath) === false && publicPath && mkdirs(publicPath);
                        // filter normal case on failure message only mode
                        if (failureMessageOnly) {
                            results.testResults = results.testResults.filter(function (i) { return !!i.failureMessage; });
                            if (failureMessageOnly === 2 && results.testResults.length === 0) {
                                this.removeTempDir();
                                this.removeResourceDir();
                                console.log('🛑 report was not created due to no failed case. [failureMessageOnly]');
                                return [2 /*return*/];
                            }
                        }
                        // filter skipped tests if stripSkippedTest
                        if (stripSkippedTest) {
                            results = (0, helper_1.filterSkipTests)(results);
                        }
                        data = JSON.stringify(results);
                        filePath = path_1.default.resolve(publicPath, filename);
                        // fs.writeFileSync('./src/devMock.json', data);
                        if (!this._options.inlineSource) {
                            fs_1.default.writeFileSync(path_1.default.resolve(this._publishResourceDir, 'result.js'), "window.jest_html_reporters_callback__(".concat(data, ")"));
                            // html
                            (0, helper_1.copyAndReplace)({
                                tmpPath: localTemplateHTMLPath,
                                outPutPath: filePath,
                                pattern: packageReplaceReg,
                                newSubstr: this._resourceRelativePath,
                            });
                            // js
                            (0, helper_1.copyAndReplace)({
                                tmpPath: localTemplateJSPath,
                                outPutPath: path_1.default.resolve(this._publishResourceDir, 'index.js'),
                                pattern: packageReplaceReg,
                                newSubstr: this._resourceRelativePath,
                            });
                        }
                        else {
                            // html
                            (0, helper_1.copyAndReplace)({
                                tmpPath: localTemplateSingleHTMLPath,
                                outPutPath: filePath,
                                pattern: packageSingleReplaceReg,
                                newSubstr: data,
                            });
                            // remove resource dir
                            if (!attachInfos.hasAttachFiles) {
                                this.removeResourceDir();
                            }
                        }
                        console.log('📦 report is created on:', filePath);
                        openIfRequested(filePath);
                        this.removeTempDir();
                        return [2 /*return*/];
                }
            });
        });
    };
    MyCustomReporter.prototype.init = function () {
        this.initAttachDir();
        this.initCoverageDirectory();
    };
    MyCustomReporter.prototype.initCoverageDirectory = function () {
        var _a = this._globalConfig, collectCoverage = _a.collectCoverage, coverageDirectory = _a.coverageDirectory, coverageReporters = _a.coverageReporters;
        if (collectCoverage && coverageDirectory) {
            var coverageDirectoryPath = path_1.default.relative(this._options.publicPath, this._globalConfig.coverageDirectory);
            if (coverageReporters.find(function (type) { return type === 'lcov'; })) {
                this._globalConfig.coverageLinkPath = path_1.default.join(coverageDirectoryPath, './lcov-report/index.html');
                return;
            }
            if (coverageReporters.find(function (type) { return type === 'html'; })) {
                this._globalConfig.coverageLinkPath = path_1.default.join(coverageDirectoryPath, './index.html');
            }
        }
    };
    MyCustomReporter.prototype.initAttachDir = function () {
        this.removeTempDir();
        this.removeAttachDir();
        fs_extra_1.default.mkdirpSync(helper_1.dataDirPath);
        fs_extra_1.default.mkdirpSync(helper_1.attachDirPath);
        fs_extra_1.default.mkdirpSync(this._publishResourceDir);
    };
    MyCustomReporter.prototype.removeTempDir = function () {
        fs_extra_1.default.removeSync(helper_1.tempDirPath);
    };
    MyCustomReporter.prototype.removeResourceDir = function () {
        fs_extra_1.default.removeSync(path_1.default.resolve(this._options.publicPath, helper_1.resourceDirName));
    };
    MyCustomReporter.prototype.removeAttachDir = function () {
        fs_extra_1.default.removeSync(this._publishResourceDir);
    };
    return MyCustomReporter;
}());
module.exports = MyCustomReporter;
