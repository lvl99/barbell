import path from "node:path";
import fs from "node:fs";
import * as utils from "./utils";
import { Stack, Reporter, Config } from "./barbell";

export interface ReporterHTMLConfig {
  outputFormat?: string;
  outputDir?: string;
  outputFileName?: string;
}

const rankingEmojis = ["🏆", "🥈", "🥉"];

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function renderHTML(date: string, stats: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Barbell results</title>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 1.5em;
      }

      dl.stats {
        /*
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-areas: "dt" "dd";
        grid-column-gap: 1em;
        grid-row-gap: 0.4em;
        */

        width: 300px;
        overflow: hidden;
      }

      dl.stats dt {
        /*
        grid-area: "dt";
        */

       display: block;
        margin: 0;
        padding: 0;
        float: left;
        clear: left;
        text-align: left;
      }

      dl.stats dd {
        /*
        grid-area: "dd";
        */

        display: block;
        margin: 0;
        padding: 0 0 0 0.3em;
        float: left;
        clear: right;
        text-align: left;
      }

      .barbell {
        max-width: 600px;
        margin: 0 auto 2em;
      }

      .bench {
        padding: 1em;
        margin-bottom: 1em;
        border: solid 1px #ddd;
        background: #fff;
      }

      .suite {
        margin-left: 1em;
        margin-bottom: 1em;
      }

      .test {
        margin-left: 1em;
        margin-bottom: 1em;
      }

      .suite h2,
      .suite h3,
      .suite h4,
      .test h2,
      .test h3,
      .test h4 {
        margin-bottom: 0.4em;
      }

      .bench:last-child,
      .suite:last-child,
      .test:last-child {
        margin-bottom: 0;
      }

      .stat {
        color: #666;
        font-style: italic;
      }

      .bar {
        display: block;
        width: 100%;
        height: 10px;
        position: relative;
        background: #ddd;
        overflow: hidden;
      }

      .bar .bar-progress {
        display: block;
        width: 3000%;
        height: 100%;
        position: absolute;
        left: -2900%;
        top: 0;
        background: linear-gradient(to right, #f00, #ff0, #0c3);
      }

      code pre {
        padding: 10px;
        margin-bottom: 10px;
        background-color: #efefef;
        color: #666;
        font-family: "Andale Mono", "Courier New", Courier, mono;
      }

      .error code pre {
        background-color: #fdd;
        color: #600;
      }
    </style>
  </head>
  <body>
    <div class="barbell">
      <h1>🏋️‍♂️ Barbell results 🏋️‍♀️</h1>
      <div class="date">${date}</div>
      <div class="stats">${stats}</div>
      <div class="results">
        ${content}
      </div>
    </div>
  </body>
</html>`;
}

export const reporterHTML: Reporter = function (
  stack: Stack,
  barbellConfig: Config
): string | void {
  const benches = Object.values(stack);
  const barbellStartTime = benches[0].startTime;
  const barbellEndTime = benches[benches.length - 1].endTime;
  let totalSuites = 0;
  let totalTests = 0;
  const stats = [];

  const content: string[] = [];
  benches.forEach((bench) => {
    const benchSuites = Object.values(bench.suites);
    totalSuites += benchSuites.length;
    content.push(`<div id=${bench.key} class="bench">`);
    content.push(`<h2>${bench.name}${bench.errored ? " (errored)" : ""}</h2>`);
    content.push(`<dl class="stats">`);
    content.push(
      `<dt class="stat time-taken">Time taken:</dt><dd class="stat time-taken">${utils.tellTime(
        bench.endTime,
        bench.startTime
      )}</dt>`
    );
    content.push(
      `<dt class="stat total-suites">Total suites:</dt><dd class="stat total-suites">${benchSuites.length}</dd>`
    );
    content.push(`</dl>`);
    if (bench.errored) {
      if (bench.error) {
        content.push(
          `<div class="error"><code><pre>${
            (bench.error as Error).stack
          }</pre></code></div>`
        );
      }
    } else {
      benchSuites.forEach((suite) => {
        // @ts-ignore
        const suiteTests = suite.instance.map((test) => test);
        totalTests += suiteTests.length;
        let slowestTestSpeed: number;
        let fastestTestSpeed: number;
        let totalSpeedDiff = 0;

        content.push(`<div id=${suite.key} class="suite">`);
        content.push(
          `<h3><span class="status">${
            suite.skipped ? "⏭" : suite.errored ? "❌" : ""
          }</span> ${suite.name} ${
            suite.skipped ? " (skipped)" : suite.errored ? " errored!" : ""
          }</h3>`
        );
        content.push(`<dl class="stats">`);
        content.push(
          `<dt class="stat total-tests">Total tests:</dt><dd class="stat total-tests">${suiteTests.length}</dt>`
        );
        content.push(
          `<dt class="stat time-taken">Time taken:</dt><dd class="stat time-taken">${utils.tellTime(
            suite.endTime,
            suite.startTime
          )}</dd>`
        );
        content.push(`</dl>`);

        if (suite.errored) {
          suite.errors.forEach((error) =>
            content.push(
              `<div class="error"><code><pre>${error.stack}</pre></code></div>`
            )
          );
        } else {
          Object.values(suite.tests)
            .map((test) => {
              if (
                !test.errored &&
                !test.skipped &&
                test.instance &&
                test.instance.stats
              ) {
                test.results.speed =
                  test.instance.stats.mean + test.instance.stats.moe;

                if (
                  slowestTestSpeed === null ||
                  slowestTestSpeed >= test.results.speed
                ) {
                  slowestTestSpeed = test.results.speed;
                }

                if (
                  fastestTestSpeed === null ||
                  fastestTestSpeed <= test.results.speed
                ) {
                  fastestTestSpeed = test.results.speed;
                }

                if (
                  typeof fastestTestSpeed === "number" &&
                  typeof slowestTestSpeed === "number"
                ) {
                  totalSpeedDiff = fastestTestSpeed - slowestTestSpeed;
                }
              }
              return test;
            })
            .sort((testA, testB) => {
              if (
                testA.skipped ||
                testA.errored ||
                !testA.results ||
                testA.results.speed === undefined
              ) {
                return -1;
              }

              if (
                testB.skipped ||
                testB.errored ||
                !testB.results ||
                testB.results.speed === undefined
              ) {
                return 0;
              }

              return testA.results.speed > testB.results.speed ? 1 : -1;
            })
            .forEach((test, index) => {
              let testRanking = "";
              let testContent = "";

              // Errored test
              if (test.errored) {
                testContent = `${
                  test.instance.error || test.error || "Unknown error"
                }`;
              }
              // Completed test
              else if (
                !test.errored &&
                !test.skipped &&
                test.instance &&
                test.results &&
                test.results.speed !== undefined
              ) {
                const hz = test.instance.hz;
                const rme = test.instance.stats.rme;
                const size = test.instance.stats.sample.length;

                testRanking =
                  suite.progress > 1 && index < rankingEmojis.length
                    ? rankingEmojis[index]
                    : "";

                let testBar = "";
                if (
                  suiteTests.length > 1 &&
                  fastestTestSpeed >= 0 &&
                  slowestTestSpeed >= 0
                ) {
                  let testSpeedDiff = fastestTestSpeed - test.results.speed;
                  let testBarSpeed = Math.ceil(
                    utils.round((test.results.speed / fastestTestSpeed) * 100)
                  );
                  let testBarPerformance = Math.ceil(
                    utils.round((testSpeedDiff / totalSpeedDiff) * 2900)
                  );

                  testBar = `<div class="bar" style="width: ${testBarSpeed}%"><div class="bar-progress" style="left: -${testBarPerformance}%;"></div></div>`;
                }

                testContent = `${testBar}<div class="results">${utils.formatNumber(
                  utils.round(hz, hz < 100 ? 2 : 0)
                )} ops/sec ± ${rme.toFixed(2)} % (${size} run${
                  size === 1 ? "" : "s"
                } sampled)</div>`;
              }

              content.push(`<div id=${test.key} class="test">`);
              content.push(
                `<h3>${
                  test.skipped || !test.instance
                    ? "⏭"
                    : test.errored
                    ? "❌"
                    : `<span class="ranking">${testRanking}</span>`
                } ${test.name} ${
                  test.skipped || !test.instance
                    ? " (skipped)"
                    : test.errored
                    ? " errored!"
                    : ""
                }</h3>`
              );

              if (!test.skipped && test.instance) {
                content.push(testContent);
              }

              content.push(`<dl class="stats">`);
              content.push(
                `<dt class="stat time-taken">Time taken:</dt><dd class="stat time-taken">${utils.tellTime(
                  test.endTime,
                  test.startTime
                )}</dd>`
              );
              content.push(`</dl>`);

              content.push(`</div><!-- /.test -->`);
            });
        }
        content.push("</div><!-- .suite -->");
      });
    }
    content.push("</div><!-- .bench -->");
  });

  stats.push(`<dl class="stats">`);
  stats.push(`<dt class="stat total-benches">Total benches:</dt>`);
  stats.push(`<dd class="stat total-benches">${benches.length}</dd>`);
  stats.push(`<dt class="stat total-suites">Total suites:</dt>`);
  stats.push(`<dd class="stat total-suites">${totalSuites}</dd>`);
  stats.push(`<dt class="stat total-tests">Total tests:</dt>`);
  stats.push(`<dd class="stat total-tests">${totalTests}</dd>`);
  stats.push(`<dt class="stat time-taken">Time taken:</dt>`);
  stats.push(
    `<dd class="stat time-taken">${utils.tellTime(
      barbellEndTime,
      barbellStartTime
    )}</dd>`
  );
  stats.push(`</dl>`);

  const outputDate = new Date();
  const output = renderHTML(
    outputDate.toISOString(),
    stats.join("\n"),
    content.join("\n")
  );

  let reporterConfig: Required<ReporterHTMLConfig> = {
    outputFormat: "file",
    outputDir: path.join(barbellConfig.rootDir, "./coverage/barbell"),
    outputFileName: undefined,
    ...barbellConfig.reporterConfig,
  };

  const outputFileName = reporterConfig.outputFileName
    ? reporterConfig.outputFileName
    : outputDate.toISOString().replace(/:/g, "_") + "_results.HTML";

  switch (reporterConfig.outputFormat) {
    default:
    case "file":
      const outputPath = path.join(reporterConfig.outputDir, outputFileName);
      ensureDirectoryExistence(outputPath);
      fs.writeFileSync(outputPath, output, "utf8");
      console.log(`\n  📊  Results: ${outputPath}`);
      break;

    case "stdout":
      console.log(output);
      break;

    case "return":
      return output;
  }
};

export default reporterHTML;
