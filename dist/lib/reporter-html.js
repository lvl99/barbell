"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reporter = void 0;
var tslib_1 = require("tslib");
var node_path_1 = tslib_1.__importDefault(require("node:path"));
var node_fs_1 = tslib_1.__importDefault(require("node:fs"));
var utils = tslib_1.__importStar(require("./utils"));
var rankingEmojis = ["🏆", "🥈", "🥉"];
function ensureDirectoryExistence(filePath) {
    var dirname = node_path_1.default.dirname(filePath);
    if (node_fs_1.default.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    node_fs_1.default.mkdirSync(dirname);
}
function renderHTML(date, stats, content) {
    return "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Barbell results</title>\n    <style>\n      * {\n        box-sizing: border-box;\n      }\n\n      body {\n        font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n        font-size: 16px;\n        line-height: 1.5em;\n      }\n\n      dl.stats {\n        /*\n        display: grid;\n        grid-template-columns: 1fr 1fr;\n        grid-template-areas: \"dt\" \"dd\";\n        grid-column-gap: 1em;\n        grid-row-gap: 0.4em;\n        */\n\n        width: 300px;\n        overflow: hidden;\n      }\n\n      dl.stats dt {\n        /*\n        grid-area: \"dt\";\n        */\n\n       display: block;\n        margin: 0;\n        padding: 0;\n        float: left;\n        clear: left;\n        text-align: left;\n      }\n\n      dl.stats dd {\n        /*\n        grid-area: \"dd\";\n        */\n\n        display: block;\n        margin: 0;\n        padding: 0 0 0 0.3em;\n        float: left;\n        clear: right;\n        text-align: left;\n      }\n\n      .barbell {\n        max-width: 600px;\n        margin: 0 auto 2em;\n      }\n\n      .bench {\n        padding: 1em;\n        margin-bottom: 1em;\n        border: solid 1px #ddd;\n        background: #fff;\n      }\n\n      .suite {\n        margin-left: 1em;\n        margin-bottom: 1em;\n      }\n\n      .test {\n        margin-left: 1em;\n        margin-bottom: 1em;\n      }\n\n      .suite h2,\n      .suite h3,\n      .suite h4,\n      .test h2,\n      .test h3,\n      .test h4 {\n        margin-bottom: 0.4em;\n      }\n\n      .bench:last-child,\n      .suite:last-child,\n      .test:last-child {\n        margin-bottom: 0;\n      }\n\n      .stat {\n        color: #666;\n        font-style: italic;\n      }\n\n      .bar {\n        display: block;\n        width: 100%;\n        height: 10px;\n        position: relative;\n        background: #ddd;\n        overflow: hidden;\n      }\n\n      .bar .bar-progress {\n        display: block;\n        width: 3000%;\n        height: 100%;\n        position: absolute;\n        left: -2900%;\n        top: 0;\n        background: linear-gradient(to right, #f00, #ff0, #0c3);\n      }\n\n      code pre {\n        padding: 10px;\n        margin-bottom: 10px;\n        background-color: #efefef;\n        color: #666;\n        font-family: \"Andale Mono\", \"Courier New\", Courier, mono;\n      }\n\n      .error code pre {\n        background-color: #fdd;\n        color: #600;\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"barbell\">\n      <h1>\uD83C\uDFCB\uFE0F\u200D\u2642\uFE0F Barbell results \uD83C\uDFCB\uFE0F\u200D\u2640\uFE0F</h1>\n      <div class=\"date\">".concat(date, "</div>\n      <div class=\"stats\">").concat(stats, "</div>\n      <div class=\"results\">\n        ").concat(content, "\n      </div>\n    </div>\n  </body>\n</html>");
}
var reporter = function (stack, barbellConfig) {
    var benches = Object.values(stack);
    var barbellStartTime = benches[0].startTime;
    var barbellEndTime = benches[benches.length - 1].endTime;
    var totalSuites = 0;
    var totalTests = 0;
    var stats = [];
    var content = [];
    benches.forEach(function (bench) {
        var benchSuites = Object.values(bench.suites);
        totalSuites += benchSuites.length;
        content.push("<div id=".concat(bench.key, " class=\"bench\">"));
        content.push("<h2>".concat(bench.name).concat(bench.errored ? " (errored)" : "", "</h2>"));
        content.push("<dl class=\"stats\">");
        content.push("<dt class=\"stat time-taken\">Time taken:</dt><dd class=\"stat time-taken\">".concat(utils.tellTime(bench.endTime, bench.startTime), "</dt>"));
        content.push("<dt class=\"stat total-suites\">Total suites:</dt><dd class=\"stat total-suites\">".concat(benchSuites.length, "</dd>"));
        content.push("</dl>");
        if (bench.errored) {
            if (bench.error) {
                content.push("<div class=\"error\"><code><pre>".concat(bench.error.stack, "</pre></code></div>"));
            }
        }
        else {
            benchSuites.forEach(function (suite) {
                // @ts-ignore
                var suiteTests = suite.instance.map(function (test) { return test; });
                totalTests += suiteTests.length;
                var slowestTestSpeed;
                var fastestTestSpeed;
                var totalSpeedDiff = 0;
                content.push("<div id=".concat(suite.key, " class=\"suite\">"));
                content.push("<h3><span class=\"status\">".concat(suite.skipped ? "⏭" : suite.errored ? "❌" : "", "</span> ").concat(suite.name, " ").concat(suite.skipped ? " (skipped)" : suite.errored ? " errored!" : "", "</h3>"));
                content.push("<dl class=\"stats\">");
                content.push("<dt class=\"stat total-tests\">Total tests:</dt><dd class=\"stat total-tests\">".concat(suiteTests.length, "</dt>"));
                content.push("<dt class=\"stat time-taken\">Time taken:</dt><dd class=\"stat time-taken\">".concat(utils.tellTime(suite.endTime, suite.startTime), "</dd>"));
                content.push("</dl>");
                if (suite.errored) {
                    suite.errors.forEach(function (error) {
                        return content.push("<div class=\"error\"><code><pre>".concat(error.stack, "</pre></code></div>"));
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
                        var testRanking = "";
                        var testContent = "";
                        // Errored test
                        if (test.errored) {
                            testContent = "".concat(test.instance.error || test.error || "Unknown error");
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
                            testRanking =
                                suite.progress > 1 && index < rankingEmojis.length
                                    ? rankingEmojis[index]
                                    : "";
                            var testBar = "";
                            if (suiteTests.length > 1 &&
                                fastestTestSpeed >= 0 &&
                                slowestTestSpeed >= 0) {
                                var testSpeedDiff = fastestTestSpeed - test.results.speed;
                                var testBarSpeed = Math.ceil(utils.round((test.results.speed / fastestTestSpeed) * 100));
                                var testBarPerformance = Math.ceil(utils.round((testSpeedDiff / totalSpeedDiff) * 2900));
                                testBar = "<div class=\"bar\" style=\"width: ".concat(testBarSpeed, "%\"><div class=\"bar-progress\" style=\"left: -").concat(testBarPerformance, "%;\"></div></div>");
                            }
                            testContent = "".concat(testBar, "<div class=\"results\">").concat(utils.formatNumber(utils.round(hz, hz < 100 ? 2 : 0)), " ops/sec \u00B1 ").concat(rme.toFixed(2), " % (").concat(size, " run").concat(size === 1 ? "" : "s", " sampled)</div>");
                        }
                        content.push("<div id=".concat(test.key, " class=\"test\">"));
                        content.push("<h3>".concat(test.skipped || !test.instance
                            ? "⏭"
                            : test.errored
                                ? "❌"
                                : "<span class=\"ranking\">".concat(testRanking, "</span>"), " ").concat(test.name, " ").concat(test.skipped || !test.instance
                            ? " (skipped)"
                            : test.errored
                                ? " errored!"
                                : "", "</h3>"));
                        if (!test.skipped && test.instance) {
                            content.push(testContent);
                        }
                        content.push("<dl class=\"stats\">");
                        content.push("<dt class=\"stat time-taken\">Time taken:</dt><dd class=\"stat time-taken\">".concat(utils.tellTime(test.endTime, test.startTime), "</dd>"));
                        content.push("</dl>");
                        content.push("</div><!-- /.test -->");
                    });
                }
                content.push("</div><!-- .suite -->");
            });
        }
        content.push("</div><!-- .bench -->");
    });
    stats.push("<dl class=\"stats\">");
    stats.push("<dt class=\"stat total-benches\">Total benches:</dt>");
    stats.push("<dd class=\"stat total-benches\">".concat(benches.length, "</dd>"));
    stats.push("<dt class=\"stat total-suites\">Total suites:</dt>");
    stats.push("<dd class=\"stat total-suites\">".concat(totalSuites, "</dd>"));
    stats.push("<dt class=\"stat total-tests\">Total tests:</dt>");
    stats.push("<dd class=\"stat total-tests\">".concat(totalTests, "</dd>"));
    stats.push("<dt class=\"stat time-taken\">Time taken:</dt>");
    stats.push("<dd class=\"stat time-taken\">".concat(utils.tellTime(barbellEndTime, barbellStartTime), "</dd>"));
    stats.push("</dl>");
    var outputDate = new Date();
    var output = renderHTML(outputDate.toISOString(), stats.join("\n"), content.join("\n"));
    var reporterConfig = tslib_1.__assign({ outputFormat: "file", outputDir: node_path_1.default.join(barbellConfig.rootDir, "./coverage/barbell"), outputFileName: undefined }, barbellConfig.reporterConfig);
    var outputFileName = reporterConfig.outputFileName
        ? reporterConfig.outputFileName
        : outputDate.toISOString().replace(/:/g, "_") + "_results.HTML";
    switch (reporterConfig.outputFormat) {
        default:
        case "file":
            var outputPath = node_path_1.default.join(reporterConfig.outputDir, outputFileName);
            ensureDirectoryExistence(outputPath);
            node_fs_1.default.writeFileSync(outputPath, output, "utf8");
            console.log("\n  \uD83D\uDCCA  Results: ".concat(outputPath));
            break;
        case "stdout":
            console.log(output);
            break;
        case "return":
            return output;
    }
};
exports.reporter = reporter;
exports.default = exports.reporter;
//# sourceMappingURL=reporter-html.js.map