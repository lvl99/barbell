"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reporter = void 0;
var tslib_1 = require("tslib");
var chalk_1 = tslib_1.__importDefault(require("chalk"));
var utils = tslib_1.__importStar(require("./utils"));
var reporter = function (stack, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
barbellConfig) {
    console.log("\nBarbell results:");
    Object.values(stack).forEach(function (bench) {
        console.log(chalk_1.default.white("\n".concat(bench.relativePath).concat(bench.errored ? chalk_1.default.red(" (errored)") : "")));
        if (bench.errored) {
            if (bench.error) {
                console.log(chalk_1.default.red("\n".concat(bench.error.stack)));
            }
        }
        else {
            Object.values(bench.suites).forEach(function (suite) {
                var suiteTests = suite.instance.map(function (test) { return test; });
                var barLength = 15;
                var slowestTestSpeed;
                var fastestTestSpeed;
                var totalSpeedDiff = 0;
                console.log("\n  ".concat(suite.skipped
                    ? chalk_1.default.yellow("○")
                    : suite.errored
                        ? chalk_1.default.red("⨯")
                        : chalk_1.default.green("✔"), " Suite #").concat(suite.index, ": ").concat(chalk_1.default.white(suite.name)).concat(suite.skipped
                    ? chalk_1.default.yellow(" (skipped)")
                    : suite.errored
                        ? chalk_1.default.red(" errored!")
                        : "", " ").concat(chalk_1.default.gray("(".concat(utils.tellTime(suite.endTime, suite.startTime), ")"))));
                if (suite.errored && suite.errors && suite.errors.length) {
                    suite.errors.forEach(function (error) {
                        return console.log(chalk_1.default.red("\n".concat(error.stack)));
                    });
                }
                else {
                    Object.values(suite.tests)
                        .map(function (test) {
                        if (!test.errored &&
                            !test.skipped &&
                            test.instance &&
                            test.instance.stats) {
                            test.results.speed =
                                test.instance.stats.mean + test.instance.stats.moe;
                            if (slowestTestSpeed === null ||
                                slowestTestSpeed >= test.results.speed) {
                                slowestTestSpeed = test.results.speed;
                            }
                            if (fastestTestSpeed === null ||
                                fastestTestSpeed <= test.results.speed) {
                                fastestTestSpeed = test.results.speed;
                            }
                            if (typeof fastestTestSpeed === "number" &&
                                typeof slowestTestSpeed === "number") {
                                totalSpeedDiff = fastestTestSpeed - slowestTestSpeed;
                            }
                        }
                        return test;
                    })
                        .sort(function (testA, testB) {
                        if (testA.skipped ||
                            testA.errored ||
                            !testA.results ||
                            testA.results.speed === undefined) {
                            return -1;
                        }
                        if (testB.skipped ||
                            testB.errored ||
                            !testB.results ||
                            testB.results.speed === undefined) {
                            return 0;
                        }
                        return testA.results.speed > testB.results.speed ? 1 : -1;
                    })
                        .forEach(function (test, index) {
                        var testRanking = " ";
                        var testOutput = "";
                        // Errored test
                        if (test.errored) {
                            testOutput = chalk_1.default.red("".concat(test.instance.error || test.error || "Unknown error"));
                        }
                        // Completed test
                        else if (!test.errored &&
                            !test.skipped &&
                            test.instance &&
                            test.results &&
                            test.results.speed !== undefined) {
                            var hz = test.instance.hz;
                            var rme = test.instance.stats.rme;
                            var size = test.instance.stats.sample.length;
                            testRanking = suite.progress > 1 && index === 0 ? "💪" : "  ";
                            var testBar = "";
                            if (suiteTests.length > 1 &&
                                fastestTestSpeed >= 0 &&
                                slowestTestSpeed >= 0) {
                                var testSpeedDiff = fastestTestSpeed - test.results.speed;
                                var testBarLength = Math.ceil(utils.round((testSpeedDiff / totalSpeedDiff) * (barLength - 1)) + 1);
                                var remainderBarLength = barLength - testBarLength;
                                testBar = "".concat("█".repeat(testBarLength)).concat(remainderBarLength
                                    ? chalk_1.default.gray("░".repeat(remainderBarLength))
                                    : "", " ");
                                // testBar = `${
                                //   testBarLength >= Math.ceil(barLength * 0.6)
                                //     ? testBarLength <= Math.ceil(barLength * 0.3)
                                //       ? chalk.red(testBar)
                                //       : chalk.green(testBar)
                                //     : chalk.yellow()
                                // }`;
                            }
                            var testResults = "".concat(utils.formatNumber(utils.round(hz, hz < 100 ? 2 : 0)), " ops/sec \u00B1 ").concat(rme.toFixed(2), " % (").concat(size, " run").concat(size === 1 ? "" : "s", " sampled)");
                            testOutput = "".concat(testBar).concat(testResults);
                        }
                        var testHeader = "\n    ".concat(test.skipped || !test.instance
                            ? chalk_1.default.yellow("○")
                            : test.errored
                                ? chalk_1.default.red("⨯")
                                : chalk_1.default.green("✔"), " Test #").concat(test.index, ": ");
                        console.log("".concat(testHeader).concat(chalk_1.default.white(test.name)).concat(test.skipped || !test.instance
                            ? chalk_1.default.yellow(" (skipped)")
                            : test.errored
                                ? chalk_1.default.red(" errored!")
                                : "", " ").concat(chalk_1.default.gray("(".concat(utils.tellTime(test.endTime, test.startTime), ")"))));
                        if (!test.skipped && test.instance) {
                            console.log("   ".concat(testRanking, " ").concat(testOutput));
                        }
                    });
                }
            });
        }
    });
};
exports.reporter = reporter;
exports.default = exports.reporter;
//# sourceMappingURL=reporter.js.map