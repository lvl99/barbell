const path = require("path");
const fs = require("fs");
const Benchmark = require("benchmark");
const uuid = require("uuid").v4;
const chalk = require("chalk");
const utils = require("./utils");
const { Subject } = require("rxjs");
const { NodeVM } = require("vm2");

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

function barbellRunner(benchPath, stack, barbellConfig) {
  const progress = new Subject();
  const fileName = path.basename(benchPath);
  const relativePath = benchPath.replace(`${barbellConfig.rootDir}/`, "./");

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

  function incrementBenchProgress() {
    ++bench.progress;

    console.log(bench.progress);

    if (bench.progress === countSuites) {
      bench.completed = true;
      bench.endTime = new Date();
      bench.output.next(
        `Benched ${bench.progress} test suites ${chalk.gray(
          `(${utils.tellTime(bench.endTime, bench.startTime)})`
        )}`
      );
      bench.output.complete();
    }
  }

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
        bench.suites[_suiteKey].errors = utils
          .toArray(bench.suites[_suiteKey].errors)
          .concat([event.target.error]);
        bench.suites[_suiteKey].endTime = new Date();

        if (barbellConfig.stopOnErrors) {
          bench.output.error(event.target.error);
        } else {
          bench.output.next(
            chalk.red(`Error in Suite #${numSuite}: ${suiteName}`)
          );
        }
      },
      onComplete: function() {
        bench.suites[_suiteKey].completed = true;
        bench.suites[_suiteKey].endTime = new Date();
        bench.suites[_suiteKey].results = {
          stats: this.stats,
          times: this.times
        };

        bench.output.next(
          `Completed Suite #${numSuite}: ${suiteName} ${chalk.gray(
            `(${utils.tellTime(
              bench.suites[_suiteKey].endTime,
              bench.suites[_suiteKey].startTime
            )})`
          )}`
        );

        incrementBenchProgress();
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
      currentSuite.errors = utils.toArray(currentSuite.errors).concat([error]);

      if (barbellConfig.stopOnErrors) {
        bench.output.error(error);
      } else {
        bench.output.complete(
          chalk.red(
            `Error occurred when running Suite #${currentSuite.index}: ${
              currentSuite.name
            }`
          )
        );
      }
    }

    // Run the suite function to assign any nested tests to it
    if (currentSuite.skipped) {
      bench.output.next(
        `Skipped Suite #${currentSuite.index}: ${currentSuite.name}`
      );
      incrementBenchProgress();
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
            bench.output.error(event.target.error);
            console.error(chalk.red(`\n${event.target.error}`));
            process.exit();
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
              `(${utils.tellTime(
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
      bench.endTime = new Date();
      bench.completed = true;
      bench.errored = true;
      bench.error = new Error(`No test suites were found in ${bench.name}!`);

      if (barbellConfig.stopOnErrors) {
        bench.output.error(bench.error);
      } else {
        bench.output.next(
          chalk.red(`No test suites were found in ${bench.name}!`)
        );
        bench.output.complete();
      }
    }
  } catch (error) {
    bench.endTime = new Date();
    bench.errored = true;
    bench.error = error;

    if (barbellConfig.stopOnErrors) {
      bench.output.error(error);
    } else {
      bench.output.next(chalk.red(`Error occurred in bench ${bench.name}`));
      bench.output.complete();
    }
  }

  return bench.output;
}

module.exports = barbellRunner;
