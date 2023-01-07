#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = void 0;
var tslib_1 = require("tslib");
var commander_1 = require("commander");
var package_json_1 = tslib_1.__importDefault(require("../package.json"));
var barbell_1 = tslib_1.__importStar(require("./barbell"));
function setConcurrent(val) {
    return parseInt(val, 10) || barbell_1.DEFAULT_CONFIG.concurrent;
}
function collect(val, memo) {
    if (memo === void 0) { memo = []; }
    if (!(memo instanceof Array)) {
        memo = [];
    }
    memo.push(val);
    return memo;
}
exports.cli = commander_1.program
    .version(package_json_1.default.version)
    .arguments("[testMatch...]")
    .option("-c, --config-path <path>", "Set path to config file")
    .option("-t, --test-match <globPatterns...>", "Set the test match glob pattern(s) to detect benchmark tests or test file paths", collect, [])
    .option("-e, --exclude <globPatterns...>", "Exclude specific files and folders", collect, [])
    .option("-C, --concurrent", "The number of benches you want to run at the same time", setConcurrent)
    .option("-x, --stop-on-errors", "Stop Barbell if any errors are found within test suites")
    .option("-v, --verbose", "Verbose mode (outputs config settings)")
    .option("-r, --runner <nameOrPath>", "Name or path to test runner")
    .option("-R, --reporter <nameOrPath>", "Name or path to test reporter")
    .action(barbell_1.default)
    .parse(process.argv);
exports.default = exports.cli;
//# sourceMappingURL=cli.js.map