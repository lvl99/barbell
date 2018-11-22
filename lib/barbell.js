const path = require("path");
const fs = require("fs");
const Benchmark = require("benchmark");
const glob = require("glob");
const uuid = require("uuid").v4;
const chalk = require("chalk");
const Listr = require("listr");
const { Subject } = require("rxjs");
const { NodeVM } = require("vm2");
const utils = require("./utils");

const DEFAULT_TEST_MATCH = [
  "**/?(__(tests|benches)__)/**/*.bench.?(t|j)s?(x)",
  "**/*.bench.?(t|j)s?(x)"
];

function NOOP() {}

function sandboxSetTimeout(fn) {
  fn.call(this);
}
function sandboxSetInterval(fn) {
  fn.call(this);
}
function sandboxSetImmediate(fn) {
  fn.call(this);
}

function getTimeFromDate(input) {
  return input instanceof Date ? input.getTime() : parseFloat(input);
}

function tellTime(...times) {
  const useTimes = times.map(getTimeFromDate);
  const useEndTime = Math.max(...useTimes);
  const useStartTime = Math.min(...useTimes);
  return utils.formatTimeDuration(useEndTime - useStartTime);
}

function runBench(benchPath, stack, barbellConfig) {
  const progress = new Subject();
  const fileName = path.basename(benchPath);
  const relativePath = benchPath.replace(`${barbellConfig.rootDir}/`, "");

  const bench = {
    key: `bench-${uuid()}`,
    name: fileName,
    path: benchPath,
    relativePath: relativePath,
    startTime: new Date(),
    endTime: 0,
    progress: 0,
    completed: false,
    errored: false,
    error: null,
    suites: {},
    results: {},
    output: progress
  };

  let countSuites = 0;
  let currentSuite = null;

  function addSuite(suiteName, suiteFn, suiteOptions) {
    const numSuite = ++countSuites;
    const _suiteKey = `suite-${uuid()}`;
    const _suite = new Benchmark.Suite(suiteName, {
      onStart: function() {
        bench.suites[_suiteKey].startTime = new Date();
        bench.output.next(`Repping Suite #${numSuite}: ${suiteName}...`);
      },
      onError: function(event) {
        bench.suites[_suiteKey].errored = true;
        bench.suites[_suiteKey].errors = utils.toArray(
          bench.suites[_suiteKey].errors
        );
        bench.suites[_suiteKey].errors.push(event.target.error);
        bench.suites[_suiteKey].endTime = new Date();

        if (barbellConfig.stopOnErrors) {
          bench.output.error(
            chalk.red(`Error in Suite #${numSuite}: ${suiteName}`)
          );
        } else {
          bench.output.next(
            chalk.red(`Error in Suite #${numSuite}: ${suiteName}`)
          );
        }
      },
      onComplete: function() {
        ++bench.progress;
        bench.suites[_suiteKey].completed = true;
        bench.suites[_suiteKey].endTime = new Date();
        bench.suites[_suiteKey].results = {
          stats: this.stats,
          times: this.times
        };

        bench.output.next(
          `Completed Suite #${numSuite}: ${suiteName} ${chalk.gray(
            `(${tellTime(
              bench.suites[_suiteKey].endTime,
              bench.suites[_suiteKey].startTime
            )})`
          )}`
        );

        if (bench.progress === countSuites) {
          bench.completed = true;
          bench.endTime = new Date();
          bench.output.next(
            `Benched ${bench.progress} test suites ${chalk.gray(
              `(${tellTime(bench.endTime, bench.startTime)})`
            )}`
          );
          bench.output.complete();
        }
      }
    });

    bench.suites[_suiteKey] = {
      key: _suiteKey,
      index: numSuite,
      instance: _suite,
      name: suiteName,
      bench,
      startTime: 0,
      endTime: 0,
      skipped: !!(suiteOptions && suiteOptions.skip),
      progress: 0,
      completed: false,
      errored: false,
      errors: null,
      tests: {},
      results: {},
      fn: suiteFn
    };

    currentSuite = bench.suites[_suiteKey];

    try {
      (function(suite, test) {
        const self = this;
        suiteFn.call(self);
      })(addSuite, addTest);
    } catch (error) {
      currentSuite.errored = true;
      currentSuite.errors = utils.toArray(currentSuite.errors);
      currentSuite.errors = currentSuite.errors.push(error);

      if (barbellConfig.stopOnErrors) {
        console.error(`\n${chalk.red(error)}`);
        process.exit(1);
      }
    }

    // Run the suite function to assign any nested tests to it
    if (currentSuite.skipped) {
      ++bench.progress;
      bench.output.next(`Skipped suite ${suiteName}`);

      if (bench.progress === countSuites) {
        bench.completed = true;
        bench.endTime = new Date();
        bench.output.next(
          `Benched ${bench.progress} test suites ${chalk.gray(
            `(${tellTime(bench.endTime, bench.startTime)})`
          )}`
        );
        bench.output.complete();
      }
    } else {
      bench.output.next(`Added suite ${suiteName}`);
    }

    currentSuite = null;
  }

  function addTest(testName, testFn, testOptions) {
    // No suite added yet
    if (!currentSuite) {
      addSuite(fileName, function addStandaloneTest() {
        addTest(testName, testFn);
      });
      return;
    }

    const parentSuite = currentSuite;
    const _testKey = `test-${uuid()}`;
    const _testIndex = Object.values(parentSuite.tests).length;
    const numTest = _testIndex + 1;
    parentSuite.tests[_testKey] = {
      key: _testKey,
      index: numTest,
      name: testName,
      instance: null,
      suite: parentSuite,
      startTime: 0,
      endTime: 0,
      skipped: parentSuite.skipped || !!(testOptions && testOptions.skip),
      completed: false,
      errored: false,
      error: null,
      results: {}
    };

    if (!parentSuite.tests[_testKey].skipped) {
      parentSuite.instance.add(testName, testFn, {
        onStart: function() {
          parentSuite.tests[_testKey].startTime = new Date();
          bench.output.next(
            `Repping Suite #${parentSuite.index}: ${
              parentSuite.name
            } ⇒ Test #${numTest}: ${testName}...`
          );
        },
        onError: function(event) {
          parentSuite.tests[_testKey].errored = true;
          parentSuite.tests[_testKey].error = event.target.error;
          parentSuite.tests[_testKey].endTime = new Date();

          if (barbellConfig.stopOnErrors) {
            bench.output.error(
              chalk.red(
                `Error in Suite #${parentSuite.index}: ${
                  parentSuite.name
                } ⇒ Test #${numTest}: ${testName}!`
              )
            );
          } else {
            bench.output.next(
              chalk.red(
                `Error in Suite #${parentSuite.index}: ${
                  parentSuite.name
                } ⇒ Test #${numTest}: ${testName}!`
              )
            );
          }
        },
        onComplete: function() {
          parentSuite.progress = ++parentSuite.progress;
          parentSuite.tests[_testKey].completed = true;
          parentSuite.tests[_testKey].endTime = new Date();
          parentSuite.tests[_testKey].results = {
            stats: this.stats,
            time: this.time
          };
          bench.output.next(
            `Completed Suite #${parentSuite.index}: ${
              parentSuite.name
            } ⇒ Test #${numTest}: ${testName} ${chalk.gray(
              `(${tellTime(
                parentSuite.tests[_testKey].endTime,
                parentSuite.tests[_testKey].startTime
              )})`
            )}`
          );
        }
      });
      parentSuite.tests[_testKey].instance =
        parentSuite.instance[parentSuite.instance.length - 1];
      bench.output.next(
        `Added Test #${numTest}: ${testName} to Suite #${parentSuite.index}: ${
          parentSuite.name
        }`
      );
    } else {
      bench.output.next(
        `Skipped Test #${numTest}: ${testName} in Suite #${
          parentSuite.index
        }: ${parentSuite.name}`
      );
    }
  }

  addSuite.skip = (suiteName, suiteFn) =>
    addSuite(suiteName, suiteFn, { skip: true });

  addTest.skip = (testName, testFn) =>
    addTest(testName, testFn, { skip: true });

  const vm = new NodeVM({
    console: "inherit",
    sandbox: {
      setTimeout: sandboxSetTimeout,
      setInterval: sandboxSetInterval,
      setImmediate: sandboxSetImmediate,
      clearTimeout: NOOP,
      clearInterval: NOOP,
      clearImmediate: NOOP,
      suite: addSuite,
      test: addTest
    },
    require: {
      external: true
    }
  });

  function sandboxCode(srcPath) {
    const src = fs.readFileSync(benchPath, { encoding: "utf8" });
    vm.run(src, srcPath);
  }

  stack[benchPath] = bench;

  try {
    sandboxCode(benchPath);
    const benchSuites = Object.values(bench.suites);
    if (benchSuites.length) {
      benchSuites.map(suite => {
        if (!suite.skipped && suite.instance) {
          suite.instance.run({
            async: true
          });
        }
      });
    } else {
      bench.completed = true;
      bench.endTime = new Date();
      bench.error = new Error("No test suites were found.");
      bench.output.next(chalk.yellow("No test suites were found."));
      bench.output.complete();

      if (barbellConfig.stopOnErrors) {
        console.error(`\n${bench.error}`);
        process.exit(1);
      }
    }
  } catch (error) {
    bench.errored = true;
    bench.endTime = new Date();
    bench.error = error;
    bench.output.error(chalk.yellow("An error occurred!"));

    if (barbellConfig.stopOnErrors) {
      console.error(`\n${error}`);
      process.exit(1);
    }
  }

  return bench.output;
}

module.exports = function barbell(testMatch = DEFAULT_TEST_MATCH, cmd) {
  const cwd = process.cwd();
  const stack = {};
  let config = {};

  // Load config
  if (cmd.config) {
    const configPath = fs.existsSync(
      /^[\/\\]/.test(cmd.config)
        ? path.normalize(cmd.config)
        : path.resolve(cwd, cmd.config)
    );
    config = require(configPath);
    config.configPath = configPath;
  }

  config = {
    rootDir: process.cwd(),
    testMatch: cmd.testMatch || testMatch,
    exclude:
      cmd.exclude && cmd.exclude.length > 0 ? cmd.exclude : ["node_modules"],
    stopOnErrors: false,
    ...config
  };

  config.testMatch = !config.testMatch
    ? DEFAULT_TEST_MATCH
    : config.testMatch instanceof Array
    ? config.testMatch.length === 0
      ? DEFAULT_TEST_MATCH
      : config.testMatch
    : [config.testMatch];

  const benches = config.testMatch.reduce((acc, globPattern) => {
    const matchedBenches = glob.sync(globPattern, {
      cwd: config.rootDir,
      root: config.rootDir,
      ignore: config.exclude,
      absolute: true
    });
    if (matchedBenches.length) {
      return acc.concat(matchedBenches);
    }
    return acc;
  }, []);

  if (benches.length === 0) {
    console.warn(
      chalk.yellow("No files containing benchmark suites or tests were found!")
    );
    process.exit();
  }

  const startTime = new Date();

  console.log("\nBarbell initialising...\n");

  // Run all the benches
  benches.forEach(benchPath => runBench(benchPath, stack, config));

  const tasks = new Listr(
    Object.values(stack).map(bench => ({
      title: bench.path,
      task: () => bench.output
    })),
    {
      concurrent: 2
    }
  );

  tasks
    .run()
    .then(() => {
      console.log("\nBenchmark results:\n");
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
              }`
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

                    testRanking =
                      suite.progress > 1 && index === 0 ? "💪" : " ";

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
                    }`
                  );

                  if (!test.skipped && test.instance) {
                    console.log(`\n   ${testRanking}  ${testOutput}`);
                  }
                });
            }
          });
        }
      });
    })
    .catch(error => {
      console.log("\nBarbell broke!\n");
      console.error(chalk.red(error.stack));
    })
    .finally(() => {
      const endTime = new Date();
      console.log(
        `\n✨ Done. ${chalk.gray(`(${tellTime(endTime, startTime)})`)}`
      );
    });
};
