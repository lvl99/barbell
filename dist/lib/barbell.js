"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.DEFAULT_TEST_MATCH = void 0;
var tslib_1 = require("tslib");
var node_path_1 = tslib_1.__importDefault(require("node:path"));
var node_fs_1 = tslib_1.__importDefault(require("node:fs"));
var glob_1 = tslib_1.__importDefault(require("glob"));
var chalk_1 = tslib_1.__importDefault(require("chalk"));
var listr_1 = tslib_1.__importDefault(require("listr"));
var js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
var find_up_1 = tslib_1.__importDefault(require("find-up"));
var utils = tslib_1.__importStar(require("./utils"));
var BUILT_IN_MODULES = {
    "barbell-runner": node_path_1.default.resolve(__dirname, "./runner"),
    "barbell-reporter": node_path_1.default.resolve(__dirname, "./reporter"),
    "barbell-reporter-html": node_path_1.default.resolve(__dirname, "./reporter-html"),
};
exports.DEFAULT_TEST_MATCH = [
    "**/__benches__/**/*(.bench)?.[tj]s",
    "**/*.bench.[tj]s",
];
exports.DEFAULT_CONFIG = Object.freeze({
    rootDir: process.cwd(),
    configPath: undefined,
    testMatch: exports.DEFAULT_TEST_MATCH,
    exclude: ["**/node_modules/**/*"],
    concurrent: 2,
    stopOnErrors: false,
    verbose: false,
    runner: "barbell-runner",
    reporter: "barbell-reporter",
});
function getFilePathIfExists(input, rootDir) {
    if (typeof input !== "string") {
        return undefined;
    }
    // If absolute path then normalise, otherwise resolve relative to the cwd
    var output = /^[\/\\]/.test(input)
        ? node_path_1.default.normalize(input)
        : node_path_1.default.resolve(rootDir || process.cwd(), input);
    return node_fs_1.default.existsSync(output) ? output : undefined;
}
function loadConfig(input, rootDir) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var config, configPath;
        return tslib_1.__generator(this, function (_a) {
            var _b;
            switch (_a.label) {
                case 0:
                    configPath = getFilePathIfExists(input, rootDir);
                    if (!configPath) return [3 /*break*/, 4];
                    if (!/\.ya?ml$/.test(configPath)) return [3 /*break*/, 1];
                    config = js_yaml_1.default.load(node_fs_1.default.readFileSync(configPath, "utf8"));
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, (_b = configPath, Promise.resolve().then(function () { return tslib_1.__importStar(require(_b)); }))];
                case 2:
                    config = _a.sent();
                    _a.label = 3;
                case 3:
                    config.configPath = configPath;
                    return [2 /*return*/, config || {}];
                case 4: throw new Error("Configuration file not found:  ".concat(configPath));
            }
        });
    });
}
function getConfig(input, rootDir) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var config, detectConfigFile;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = {};
                    if (!input) return [3 /*break*/, 2];
                    return [4 /*yield*/, loadConfig(input, rootDir)];
                case 1:
                    config = _a.sent();
                    return [3 /*break*/, 4];
                case 2:
                    detectConfigFile = glob_1.default.sync("".concat(rootDir || ".", "/barbell.config.@(js|json|yml|yaml)"));
                    if (!detectConfigFile.length) return [3 /*break*/, 4];
                    return [4 /*yield*/, loadConfig(detectConfigFile[0])];
                case 3:
                    config = _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, config];
            }
        });
    });
}
function getModule(input, rootDir, defaultValue) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var filePath;
        return tslib_1.__generator(this, function (_a) {
            var _b, _c, _d;
            // Function
            if (typeof input === "function") {
                return [2 /*return*/, input];
            }
            // Import package/script
            if (typeof input === "string") {
                // Use keyword for built-in module
                if (Object.keys(BUILT_IN_MODULES).indexOf(input) !== -1) {
                    return [2 /*return*/, (_b = BUILT_IN_MODULES[input], Promise.resolve().then(function () { return tslib_1.__importStar(require(_b)); })).then(function (m) { return m.default; })];
                }
                // Require based on package name
                else if (/^[^\.\/\\]/.test(input)) {
                    return [2 /*return*/, (_c = input, Promise.resolve().then(function () { return tslib_1.__importStar(require(_c)); })).then(function (m) { return m.default; })];
                }
                // Require based on absolute or relative path
                else {
                    filePath = getFilePathIfExists(input, rootDir);
                    if (filePath) {
                        return [2 /*return*/, (_d = filePath, Promise.resolve().then(function () { return tslib_1.__importStar(require(_d)); })).then(function (m) { return m.default; })];
                    }
                    else {
                        if (defaultValue) {
                            return [2 /*return*/, getModule(defaultValue, rootDir)];
                        }
                        else {
                            throw new Error("Failed to locate ".concat(input, "!"));
                        }
                    }
                }
            }
            throw new Error("Invalid param given");
        });
    });
}
function barbell(testMatch, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var stack, loadedConfig, _a, defaultRootDir, config, runner, _b, reporter, _c, _config, benches, startTime, benched, tasks;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    stack = {};
                    if (!options.configPath) return [3 /*break*/, 2];
                    return [4 /*yield*/, getConfig(options.configPath)];
                case 1:
                    _a = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = {};
                    _d.label = 3;
                case 3:
                    loadedConfig = _a;
                    return [4 /*yield*/, (0, find_up_1.default)("package.json").then(function (pkgPath) {
                            return pkgPath ? node_path_1.default.dirname(pkgPath) : node_path_1.default.join(__dirname, "..", "..");
                        })];
                case 4:
                    defaultRootDir = _d.sent();
                    config = {
                        rootDir: utils.useFirstDefined(options.rootDir, loadedConfig.rootDir, defaultRootDir),
                        configPath: options.configPath || "",
                        testMatch: tslib_1.__spreadArray([], utils.useFirstNonEmptyArray(testMatch, options.testMatch, loadedConfig.testMatch, exports.DEFAULT_TEST_MATCH), true),
                        exclude: tslib_1.__spreadArray([], utils.useFirstNonEmptyArray(options.exclude, exports.DEFAULT_CONFIG.exclude), true),
                        concurrent: utils.useFirstValid(function (x) { return typeof x === "number" && x > 0; }, options.concurrent, loadedConfig.concurrent, exports.DEFAULT_CONFIG.concurrent),
                        stopOnErrors: utils.useFirstDefined(options.stopOnErrors, loadedConfig.stopOnErrors, exports.DEFAULT_CONFIG.stopOnErrors),
                        verbose: utils.useFirstDefined(options.verbose, loadedConfig.verbose, exports.DEFAULT_CONFIG.verbose),
                        runner: utils.useFirstDefined(options.runner, loadedConfig.runner, exports.DEFAULT_CONFIG.runner),
                        reporter: utils.useFirstDefined(options.reporter, loadedConfig.reporter, exports.DEFAULT_CONFIG.reporter),
                        reporterConfig: utils.useFirstDefined(options.reporterConfig, loadedConfig.reporterConfig, {}),
                    };
                    _b = typeof config.runner;
                    switch (_b) {
                        case "string": return [3 /*break*/, 5];
                        case "function": return [3 /*break*/, 7];
                    }
                    return [3 /*break*/, 8];
                case 5: return [4 /*yield*/, getModule(config.runner, config.rootDir, exports.DEFAULT_CONFIG.runner)];
                case 6:
                    runner = _d.sent();
                    return [3 /*break*/, 9];
                case 7:
                    runner = config.runner;
                    return [3 /*break*/, 9];
                case 8: throw new Error("No runner specified!");
                case 9:
                    _c = typeof config.reporter;
                    switch (_c) {
                        case "string": return [3 /*break*/, 10];
                        case "function": return [3 /*break*/, 12];
                    }
                    return [3 /*break*/, 13];
                case 10: return [4 /*yield*/, getModule(config.reporter, config.rootDir, exports.DEFAULT_CONFIG.reporter)];
                case 11:
                    reporter = _d.sent();
                    return [3 /*break*/, 14];
                case 12:
                    reporter = config.reporter;
                    return [3 /*break*/, 14];
                case 13: throw new Error("No reporter specified!");
                case 14:
                    _config = tslib_1.__assign(tslib_1.__assign({}, config), { runner: runner, reporter: reporter });
                    if (_config.verbose) {
                        console.log("\n📣 Barbell running in verbose mode\n");
                        console.log(_config);
                    }
                    if (!_config.testMatch || !_config.testMatch.length) {
                        console.error(chalk_1.default.red("No glob patterns were given to find tests!"));
                        process.exit(1);
                    }
                    benches = utils.filterUnique(_config.testMatch.reduce(function (acc, globPattern) {
                        var matchedBenches = glob_1.default.sync(globPattern, {
                            cwd: _config.rootDir,
                            ignore: _config.exclude,
                            absolute: true,
                        });
                        if (matchedBenches.length) {
                            return acc.concat(matchedBenches);
                        }
                        return acc;
                    }, []));
                    if (benches.length === 0) {
                        console.error(chalk_1.default.yellow("No files containing benchmark suites or tests were found!"));
                        process.exit();
                    }
                    startTime = new Date();
                    console.log("\nBarbell initialising...\n");
                    // Initialise and run all the benches
                    benches.forEach(function (benchPath) { return _config.runner(benchPath, stack, _config); });
                    benched = Object.values(stack);
                    if (benched.length === 0) {
                        console.error(chalk_1.default.red("\nNo bench test suites were created!"));
                        process.exit();
                    }
                    tasks = new listr_1.default(
                    // @ts-ignore
                    benched.map(function (bench) { return ({
                        title: bench.relativePath,
                        task: function () { return bench.output; },
                    }); }), {
                        concurrent: _config.concurrent,
                    });
                    tasks
                        .run()
                        .then(function () { return _config.reporter(stack, _config); })
                        .catch(function (error) {
                        console.log("\nBarbell broke!");
                        console.error(chalk_1.default.red("\n".concat(error.stack)));
                        process.exit();
                    })
                        .finally(function () {
                        var endTime = new Date();
                        console.log("\n\u2728 Done. ".concat(chalk_1.default.gray("(".concat(utils.tellTime(endTime, startTime), ")"))));
                        process.exit();
                    });
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = barbell;
//# sourceMappingURL=barbell.js.map