const chalk = require("chalk");
const utils = require("./utils");

function barbellReporter(stack, barbellConfig) {
  console.log("\nBarbell results:\n");

  Object.values(stack).forEach(bench => {
    console.log(
      chalk.white(
        `${bench.path}${bench.errored ? chalk.red(" (errored)") : ""}`
      )
    );
    if (bench.errored) {
      if (bench.error) {
        console.log(chalk.red(`\n${bench.error.stack}`));
      }
    } else {
      Object.values(bench.suites).forEach(suite => {
        const suiteTests = suite.instance.map(test => test);
        const barLength = 15;
        let slowestTestSpeed = null;
        let fastestTestSpeed = null;
        let totalSpeedDiff = 0;

        console.log(
          `\n  ${
            suite.skipped
              ? chalk.yellow("○")
              : suite.errored
              ? chalk.red("⨯")
              : chalk.green("✔")
          } Suite #${suite.index}: ${chalk.white(suite.name)}${
            suite.skipped
              ? chalk.yellow(" (skipped)")
              : suite.errored
              ? chalk.red(" errored!")
              : ""
          } ${chalk.gray(
            `(${utils.tellTime(suite.endTime, suite.startTime)})`
          )}`
        );

        if (suite.errored) {
          suite.errors.forEach(error =>
            console.log(chalk.red(`\n${error.stack}`))
          );
        } else {
          Object.values(suite.tests)
            .map(test => {
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
              let testRanking = " ";
              let testOutput = "";

              // Errored test
              if (test.errored) {
                testOutput = chalk.red(
                  `${test.instance.error || test.error || "Unknown error"}`
                );
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

                testRanking = suite.progress > 1 && index === 0 ? "💪" : " ";

                let testBar = "";
                if (
                  suiteTests.length > 1 &&
                  fastestTestSpeed >= 0 &&
                  slowestTestSpeed >= 0
                ) {
                  let testSpeedDiff = fastestTestSpeed - test.results.speed;
                  let testBarLength = Math.ceil(
                    utils.round(
                      (testSpeedDiff / totalSpeedDiff) * (barLength - 1)
                    ) + 1
                  );
                  let remainderBarLength = barLength - testBarLength;

                  testBar = `${"█".repeat(testBarLength)}${
                    remainderBarLength
                      ? chalk.gray("░".repeat(remainderBarLength))
                      : ""
                  } `;
                  // testBar = `${
                  //   testBarLength >= Math.ceil(barLength * 0.6)
                  //     ? testBarLength <= Math.ceil(barLength * 0.3)
                  //       ? chalk.red(testBar)
                  //       : chalk.green(testBar)
                  //     : chalk.yellow()
                  // }`;
                }

                let testResults = `${utils.formatNumber(
                  utils.round(hz, hz < 100 ? 2 : 0)
                )} ops/sec ± ${rme.toFixed(2)} % (${size} run${
                  size === 1 ? "" : "s"
                } sampled)`;
                testOutput = `${testBar}${testResults}`;
              }

              let testHeader = `\n    ${
                test.skipped || !test.instance
                  ? chalk.yellow("○")
                  : test.errored
                  ? chalk.red("⨯")
                  : chalk.green("✔")
              } Test #${test.index}: `;

              console.log(
                `${testHeader}${chalk.white(test.name)}${
                  test.skipped || !test.instance
                    ? chalk.yellow(" (skipped)")
                    : test.errored
                    ? chalk.red(" errored!")
                    : ""
                } ${chalk.gray(
                  `(${utils.tellTime(test.endTime, test.startTime)})`
                )}`
              );

              if (!test.skipped && test.instance) {
                console.log(`\n   ${testRanking}  ${testOutput}`);
              }
            });
        }
      });
    }
  });
}

module.exports = barbellReporter;
