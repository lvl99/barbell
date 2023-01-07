"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runner = void 0;
var tslib_1 = require("tslib");
var node_path_1 = tslib_1.__importDefault(require("node:path"));
var node_fs_1 = tslib_1.__importDefault(require("node:fs"));
var benchmark_1 = tslib_1.__importDefault(require("benchmark"));
var uuid_1 = require("uuid");
var chalk_1 = tslib_1.__importDefault(require("chalk"));
var rxjs_1 = require("rxjs");
var vm2_1 = require("vm2");
var utils = tslib_1.__importStar(require("./utils"));
function NOOP() { }
function sandboxSetTimeout(callback, ms) {
    // @ts-ignore
    callback.call(this);
}
function sandboxSetInterval(callback, ms) {
    // @ts-ignore
    callback.call(this);
}
function sandboxSetImmediate(callback) {
    // @ts-ignore
    callback.call(this);
}
/**
 * Run the suite(s) of tests per bench file.
 */
var runner = function (benchPath, stack, barbellConfig) {
    var output = new rxjs_1.Subject();
    var fileName = node_path_1.default.basename(benchPath);
    var relativePath = benchPath.replace("".concat(barbellConfig.rootDir, "/"), "./");
    var bench = {
        key: "bench-".concat((0, uuid_1.v4)()),
        name: fileName,
        path: benchPath,
        relativePath: relativePath,
        startTime: new Date(),
        endTime: null,
        progress: 0,
        completed: false,
        errored: false,
        error: undefined,
        suites: {},
        results: {
            stats: {},
            times: {},
            speed: 0,
        },
        output: output,
    };
    var countSuites = 0;
    var currentSuite;
    function incrementBenchProgress() {
        ++bench.progress;
        if (bench.progress === countSuites) {
            bench.completed = true;
            bench.endTime = new Date();
            bench.output.next("Benched ".concat(bench.progress, " test suites ").concat(chalk_1.default.gray("(".concat(utils.tellTime(bench.endTime, bench.startTime), ")"))));
            bench.output.complete();
        }
    }
    function addSuite(suiteName, suiteFn, suiteOptions) {
        var numSuite = ++countSuites;
        var _suiteKey = "suite-".concat((0, uuid_1.v4)());
        var _suite = new benchmark_1.default.Suite(suiteName, {
            onStart: function () {
                bench.suites[_suiteKey].startTime = new Date();
                bench.output.next("Repping Suite #".concat(numSuite, ": ").concat(suiteName, "..."));
            },
            // @ts-ignore
            onError: function (event) {
                bench.suites[_suiteKey].errored = true;
                bench.suites[_suiteKey].errors = utils
                    .toArray(bench.suites[_suiteKey].errors)
                    .concat([event.target.error]);
                bench.suites[_suiteKey].endTime = new Date();
                if (barbellConfig.stopOnErrors) {
                    bench.output.error(event.target.error);
                }
                else {
                    bench.output.next(chalk_1.default.red("Error in Suite #".concat(numSuite, ": ").concat(suiteName)));
                }
            },
            onComplete: function () {
                bench.suites[_suiteKey].completed = true;
                bench.suites[_suiteKey].endTime = new Date();
                bench.suites[_suiteKey].results = {
                    // @ts-ignore
                    stats: this.stats,
                    // @ts-ignore
                    times: this.times,
                    speed: 0,
                };
                bench.output.next("Completed Suite #".concat(numSuite, ": ").concat(suiteName, " ").concat(chalk_1.default.gray("(".concat(utils.tellTime(bench.suites[_suiteKey].endTime, bench.suites[_suiteKey].startTime), ")"))));
                incrementBenchProgress();
            },
        });
        bench.suites[_suiteKey] = {
            key: _suiteKey,
            index: numSuite,
            instance: _suite,
            name: suiteName,
            bench: bench,
            startTime: 0,
            endTime: 0,
            skipped: !!(suiteOptions && suiteOptions.skip),
            progress: 0,
            completed: false,
            errored: false,
            errors: [],
            tests: {},
            results: {
                stats: {},
                times: {},
                speed: 0,
            },
            fn: suiteFn,
        };
        currentSuite = bench.suites[_suiteKey];
        try {
            (function (describe, suite, bench, test, it, rep) {
                // @ts-ignore
                suiteFn.call(this);
            })(addSuite, addSuite, addSuite, addTest, addTest, addTest);
        }
        catch (error) {
            currentSuite.errored = true;
            currentSuite.errors = utils.toArray(currentSuite.errors).concat([error]);
            if (barbellConfig.stopOnErrors) {
                bench.output.error(error);
            }
            else {
                bench.output.complete(
                // @ts-ignore
                chalk_1.default.red("Error occurred when running Suite #".concat(currentSuite.index, ": ").concat(currentSuite.name)));
            }
        }
        // Run the suite function to assign any nested tests to it
        if (currentSuite.skipped) {
            bench.output.next("Skipped Suite #".concat(currentSuite.index, ": ").concat(currentSuite.name));
            incrementBenchProgress();
        }
        else {
            bench.output.next("Added suite ".concat(suiteName));
        }
        currentSuite = undefined;
    }
    function addTest(testName, testFn, testOptions) {
        // No suite added yet
        if (!currentSuite) {
            addSuite(fileName, function addStandaloneTest() {
                addTest(testName, testFn);
            });
            return;
        }
        var parentSuite = currentSuite;
        var _testKey = "test-".concat((0, uuid_1.v4)());
        var _testIndex = Object.values(parentSuite.tests).length;
        var numTest = _testIndex + 1;
        parentSuite.tests[_testKey] = {
            key: _testKey,
            index: numTest,
            name: testName,
            // @ts-ignore
            instance: undefined,
            suite: parentSuite,
            startTime: 0,
            endTime: 0,
            skipped: parentSuite.skipped || !!(testOptions && testOptions.skip),
            completed: false,
            errored: false,
            error: undefined,
            results: {
                stats: {},
                times: {},
                speed: 0,
            },
        };
        if (!parentSuite.tests[_testKey].skipped) {
            parentSuite.instance.add(testName, testFn, {
                onStart: function () {
                    parentSuite.tests[_testKey].startTime = new Date();
                    bench.output.next("Repping Suite #".concat(parentSuite.index, ": ").concat(parentSuite.name, " \u21D2 Test #").concat(numTest, ": ").concat(testName, "..."));
                },
                // @ts-ignore
                onError: function (event) {
                    parentSuite.tests[_testKey].errored = true;
                    parentSuite.tests[_testKey].error = event.target.error;
                    parentSuite.tests[_testKey].endTime = new Date();
                    if (barbellConfig.stopOnErrors) {
                        bench.output.error(event.target.error);
                        console.error(chalk_1.default.red("\n".concat(event.target.error)));
                        process.exit();
                    }
                    else {
                        bench.output.next(chalk_1.default.red("Error in Suite #".concat(parentSuite.index, ": ").concat(parentSuite.name, " \u21D2 Test #").concat(numTest, ": ").concat(testName, "!")));
                    }
                },
                onComplete: function () {
                    parentSuite.progress = ++parentSuite.progress;
                    parentSuite.tests[_testKey].completed = true;
                    parentSuite.tests[_testKey].endTime = new Date();
                    parentSuite.tests[_testKey].results = {
                        // @ts-ignore
                        stats: this.stats,
                        // @ts-ignore
                        times: this.times,
                        speed: 0,
                    };
                    bench.output.next("Completed Suite #".concat(parentSuite.index, ": ").concat(parentSuite.name, " \u21D2 Test #").concat(numTest, ": ").concat(testName, " ").concat(chalk_1.default.gray("(".concat(utils.tellTime(parentSuite.tests[_testKey].endTime, parentSuite.tests[_testKey].startTime), ")"))));
                },
            });
            parentSuite.tests[_testKey].instance =
                // @ts-ignore
                parentSuite.instance[parentSuite.instance.length - 1];
            bench.output.next("Added Test #".concat(numTest, ": ").concat(testName, " to Suite #").concat(parentSuite.index, ": ").concat(parentSuite.name));
        }
        else {
            bench.output.next("Skipped Test #".concat(numTest, ": ").concat(testName, " in Suite #").concat(parentSuite.index, ": ").concat(parentSuite.name));
        }
    }
    addSuite.skip = function (suiteName, suiteFn) {
        return addSuite(suiteName, suiteFn, { skip: true });
    };
    addTest.skip = function (testName, testFn) {
        return addTest(testName, testFn, { skip: true });
    };
    var vm = new vm2_1.NodeVM({
        console: "inherit",
        sandbox: {
            setTimeout: sandboxSetTimeout,
            setInterval: sandboxSetInterval,
            setImmediate: sandboxSetImmediate,
            clearTimeout: NOOP,
            clearInterval: NOOP,
            clearImmediate: NOOP,
            describe: addSuite,
            suite: addSuite,
            bench: addSuite,
            test: addTest,
            it: addTest,
            rep: addTest,
        },
        require: {
            external: true,
        },
    });
    function sandboxCode(srcPath) {
        var src = node_fs_1.default.readFileSync(srcPath, { encoding: "utf8" });
        vm.run(src, srcPath);
    }
    stack[benchPath] = bench;
    try {
        sandboxCode(benchPath);
        var benchSuites = Object.values(bench.suites);
        if (benchSuites.length) {
            benchSuites.map(function (suite) {
                if (!suite.skipped && suite.instance) {
                    suite.instance.run({
                        async: true,
                    });
                }
            });
        }
        else {
            bench.endTime = new Date();
            bench.completed = true;
            bench.errored = true;
            bench.error = new Error("No test suites were found in ".concat(bench.name, "!"));
            if (barbellConfig.stopOnErrors) {
                bench.output.error(bench.error);
            }
            else {
                bench.output.next(chalk_1.default.red("No test suites were found in ".concat(bench.name, "!")));
                bench.output.complete();
            }
        }
    }
    catch (error) {
        bench.endTime = new Date();
        bench.errored = true;
        bench.error = error;
        if (barbellConfig.stopOnErrors) {
            bench.output.error(error);
        }
        else {
            bench.output.next(chalk_1.default.red("Error occurred in bench ".concat(bench.name)));
            bench.output.complete();
        }
    }
    return bench.output;
};
exports.runner = runner;
exports.default = exports.runner;
//# sourceMappingURL=runner.js.map