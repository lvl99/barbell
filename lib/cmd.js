const path = require("path");
const fs = require("fs");
const glob = require("glob");
const chalk = require("chalk");
const Listr = require("listr");
const yaml = require("js-yaml");
const utils = require("./utils");

const DEFAULT_TEST_MATCH = [
  "**/?(__(tests|benches)__)/**/*.bench.?(t|j)s?(x)",
  "**/*.bench.?(t|j)s?(x)"
];

const DEFAULT_CONFIG = Object.freeze({
  rootDir: process.cwd(),
  configPath: undefined,
  testMatch: DEFAULT_TEST_MATCH,
  exclude: ["node_modules"],
  concurrent: 2,
  stopOnErrors: false,
  runner: path.resolve(__dirname, "./runner.js"),
  reporter: path.resolve(__dirname, "./reporter.js")
});

function getFilePathIfExists(input, rootDir) {
  if (typeof input !== "string") {
    return undefined;
  }

  // If absolute path then normalise, otherwise resolve relative to the cwd
  const output = /^[\/\\]/.test(input)
    ? path.normalize(input)
    : path.resolve(rootDir || process.cwd(), input);

  return fs.existsSync(output) ? output : undefined;
}

function getModule(input, rootDir, defaultValue) {
  // Function
  if (typeof input === "function") {
    return input;
  }

  // Import package/script
  if (typeof input === "string") {
    if (/^[^\.\/\\]/.test(input)) {
      return require(input);
    } else {
      // File path
      const filePath = getFilePathIfExists(input, rootDir);
      if (filePath) {
        return require(filePath);
      } else {
        if (defaultValue) {
          return getModule(defaultValue, rootDir);
        } else {
          throw new Error(`Failed to locate ${input}!`);
        }
      }
    }
  }

  throw new Error("Invalid param given");
}

function barbell(testMatch, cmd) {
  const stack = {};
  let config = {};

  // Load config (if it exists)
  if (cmd.config) {
    const configPath = getFilePathIfExists(cmd.config);

    if (configPath) {
      // Load Yaml version
      if (/\.ya?ml$/.test(configPath)) {
        config = yaml.safeLoad(fs.readFileSync(configPath, "utf8"));
      }
      // Load JS/JSON version
      else {
        config = require(configPath);
      }
      config.configPath = configPath;
    }
  }

  config = {
    ...DEFAULT_CONFIG,
    rootDir: cmd.rootDir || DEFAULT_CONFIG.rootDir,
    testMatch: testMatch || cmd.testMatch || DEFAULT_CONFIG.testMatch,
    exclude:
      cmd.exclude && cmd.exclude.length > 0
        ? cmd.exclude
        : DEFAULT_CONFIG.exclude,
    stopOnErrors: !!cmd.stopOnErrors,
    concurrent: cmd.concurrent > 0 ? cmd.concurrent : DEFAULT_CONFIG.concurrent,
    ...config
  };

  config.testMatch =
    !config.testMatch || !utils.toArray(config.testMatch).length
      ? DEFAULT_TEST_MATCH
      : utils.toArray(config.testMatch);

  if (cmd.verbose) {
    console.log("\nBarbell running in verbose mode\n");
    console.log(config);
  }

  if (!config.testMatch.length) {
    console.error(chalk.red("No glob patterns were given to find tests!"));
    process.exit();
  }

  // Get the runner function
  config.runner = getModule(
    config.runner,
    config.rootDir,
    DEFAULT_CONFIG.runner
  );

  // Get the reporter function
  config.reporter = getModule(
    config.reporter,
    config.rootDir,
    DEFAULT_CONFIG.reporter
  );

  const benches = utils.filterUnique(
    config.testMatch.reduce((acc, globPattern) => {
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
    }, [])
  );

  if (benches.length === 0) {
    console.error(
      chalk.yellow("No files containing benchmark suites or tests were found!")
    );
    process.exit();
  }

  const startTime = new Date();

  console.log("\nBarbell initialising...\n");

  // Initialise and run all the benches
  benches.forEach(benchPath => config.runner(benchPath, stack, config));

  const benched = Object.values(stack);
  if (benched.length === 0) {
    console.error(chalk.red("\nNo bench test suites were created!"));
    process.exit();
  }

  const tasks = new Listr(
    benched.map(bench => ({
      title: bench.relativePath,
      task: () => bench.output
    })),
    {
      concurrent: config.concurrent
    }
  );

  tasks
    .run()
    .then(() => {
      config.reporter(stack, config);
    })
    .catch(error => {
      console.log("\nBarbell broke!");
      console.error(chalk.red(`\n${error.stack}`));
      process.exit();
    })
    .finally(() => {
      const endTime = new Date();
      console.log(
        `\n✨ Done. ${chalk.gray(`(${utils.tellTime(endTime, startTime)})`)}`
      );
      process.exit();
    });
}

barbell.defaultConfig = { ...DEFAULT_CONFIG };

module.exports = barbell;
