import path from "node:path";
import fs from "node:fs";
import glob from "glob";
import chalk from "chalk";
import Listr from "listr";
import yaml from "js-yaml";
import * as Benchmark from "benchmark";
import { Subject } from "rxjs";
import findUp from "find-up";
import * as utils from "./utils";

export type StartTime = utils.DateOrTime;
export type EndTime = utils.DateOrTime | null | undefined;

export type Output = Subject<string | number>;

export interface Results {
  stats: Benchmark.Stats | object;
  times: Benchmark.Times | object;
  speed: number;
}

export interface Bench {
  key: string;
  name: string;
  path: string;
  relativePath: string;
  startTime: StartTime;
  endTime: EndTime;
  progress: number;
  completed: boolean;
  errored: boolean;
  error: Error | unknown;
  suites: Suites;
  results: Results;
  output: Output;
}

export interface Stack {
  [path: string]: Bench;
}

export interface SuiteOptions {
  skip?: boolean;
}

export interface Suite {
  key: string;
  index: number;
  instance: Benchmark.Suite;
  name: string;
  bench: Bench;
  startTime: StartTime;
  endTime: EndTime;
  progress: number;
  skipped: boolean;
  completed: boolean;
  errored: boolean;
  errors: Error[];
  tests: Tests;
  results: Results;
  fn: Function;
}

export interface Suites {
  [key: string]: Suite;
}

export interface Test {
  key: string;
  index: number;
  name: string;
  instance: Benchmark;
  suite: Suite;
  startTime: StartTime;
  endTime: EndTime;
  skipped: boolean;
  completed: boolean;
  errored: boolean;
  error: Error | unknown;
  results: Results;
}

export interface TestOptions {
  skip?: boolean;
}

export interface Tests {
  [key: string]: Test;
}

export type Runner = (
  benchPath: string,
  stack: Stack,
  barbellConfig: Config
) => Output;

export type Reporter = (stack: Stack, barbellConfig: Config) => string | void;

export type Module = Runner | Reporter;

export interface ConfigOptions {
  rootDir?: string;
  configPath?: string;
  testMatch?: string[];
  exclude?: string[];
  concurrent?: number;
  stopOnErrors?: boolean;
  verbose?: boolean;
  debug?: boolean;
  runner?: string | Runner;
  reporter?: string | Reporter;
  reporterConfig?: any;
}

export interface Config
  extends Omit<Required<ConfigOptions>, "reporterConfig"> {
  runner: Runner;
  reporter: Reporter;
  reporterConfig?: any;
}

const BUILT_IN_MODULES: { [key: string]: string | Module } = {
  "barbell-runner": path.resolve(__dirname, "./runner"),
  "barbell-reporter": path.resolve(__dirname, "./reporter"),
  "barbell-reporter-html": path.resolve(__dirname, "./reporter-html"),
};

export const DEFAULT_TEST_MATCH = [
  "**/__benches__/**/*(.bench)?.[tj]s",
  "**/*.bench.[tj]s",
];

export const DEFAULT_CONFIG = Object.freeze({
  rootDir: process.cwd(),
  configPath: undefined,
  testMatch: DEFAULT_TEST_MATCH,
  exclude: ["**/node_modules/**/*"],
  concurrent: 2,
  stopOnErrors: false,
  verbose: false,
  runner: "barbell-runner",
  reporter: "barbell-reporter",
});

function getFilePathIfExists(
  input: string,
  rootDir?: string
): string | undefined {
  if (typeof input !== "string") {
    return undefined;
  }

  // If absolute path then normalise, otherwise resolve relative to the cwd
  const output = /^[\/\\]/.test(input)
    ? path.normalize(input)
    : path.resolve(rootDir || process.cwd(), input);

  return fs.existsSync(output) ? output : undefined;
}

async function loadConfig(
  input: string,
  rootDir?: string
): Promise<ConfigOptions> {
  let config: ConfigOptions;

  const configPath = getFilePathIfExists(input, rootDir);
  if (configPath) {
    // Load Yaml version
    if (/\.ya?ml$/.test(configPath)) {
      config = yaml.load(fs.readFileSync(configPath, "utf8")) as ConfigOptions;
    }
    // Load JS/JSON version
    else {
      config = await import(configPath);
    }
    config.configPath = configPath;
    return config || ({} as ConfigOptions);
  }

  throw new Error(`Configuration file not found:  ${configPath}`);
}

async function getConfig(
  input?: string,
  rootDir?: string
): Promise<ConfigOptions> {
  let config: ConfigOptions = {};

  // Load from path
  if (input) {
    config = await loadConfig(input, rootDir);
  }
  // Automatically detect if config file exists in path
  else {
    const detectConfigFile = glob.sync(
      `${rootDir || "."}/barbell.config.@(js|json|yml|yaml)`
    );
    if (detectConfigFile.length) {
      config = await loadConfig(detectConfigFile[0]);
    }
  }

  return config;
}

async function getModule<T = any>(
  input: string,
  rootDir: string,
  defaultValue?: any
): Promise<T> {
  // Function
  if (typeof input === "function") {
    return input;
  }

  // Import package/script
  if (typeof input === "string") {
    // Use keyword for built-in module
    if (Object.keys(BUILT_IN_MODULES).indexOf(input) !== -1) {
      return import(BUILT_IN_MODULES[input] as string).then((m) => m.default);
    }
    // Require based on package name
    else if (/^[^\.\/\\]/.test(input)) {
      return import(input).then((m) => m.default);
    }
    // Require based on absolute or relative path
    else {
      // File path
      const filePath = getFilePathIfExists(input, rootDir);
      if (filePath) {
        return import(filePath).then((m) => m.default);
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

async function barbell(testMatch: string[], options: ConfigOptions) {
  const stack = {};
  let loadedConfig = options.configPath
    ? await getConfig(options.configPath)
    : {};

  const defaultRootDir = await findUp("package.json").then((pkgPath) =>
    pkgPath ? path.dirname(pkgPath) : path.join(__dirname, "..", "..")
  );

  const config: Omit<ConfigOptions, "rootDir"> &
    Required<Pick<ConfigOptions, "rootDir">> = {
    rootDir: utils.useFirstDefined(
      options.rootDir,
      loadedConfig.rootDir,
      defaultRootDir
    ),
    configPath: options.configPath || "",
    testMatch: [
      ...utils.useFirstNonEmptyArray(
        testMatch,
        options.testMatch,
        loadedConfig.testMatch,
        DEFAULT_TEST_MATCH
      ),
    ],
    exclude: [
      ...utils.useFirstNonEmptyArray(options.exclude, DEFAULT_CONFIG.exclude),
    ],
    concurrent: utils.useFirstValid(
      (x) => typeof x === "number" && x > 0,
      options.concurrent,
      loadedConfig.concurrent,
      DEFAULT_CONFIG.concurrent
    ),
    stopOnErrors: utils.useFirstDefined(
      options.stopOnErrors,
      loadedConfig.stopOnErrors,
      DEFAULT_CONFIG.stopOnErrors
    ),
    verbose: utils.useFirstDefined(
      options.verbose,
      loadedConfig.verbose,
      DEFAULT_CONFIG.verbose
    ),
    runner: utils.useFirstDefined(
      options.runner,
      loadedConfig.runner,
      DEFAULT_CONFIG.runner
    ),
    reporter: utils.useFirstDefined(
      options.reporter,
      loadedConfig.reporter,
      DEFAULT_CONFIG.reporter
    ),
    reporterConfig: utils.useFirstDefined(
      options.reporterConfig,
      loadedConfig.reporterConfig,
      {}
    ),
  };

  // Get the runner module or function
  let runner: Runner;
  switch (typeof config.runner) {
    case "string":
      runner = await getModule<Runner>(
        config.runner,
        config.rootDir,
        DEFAULT_CONFIG.runner
      );
      break;
    case "function":
      runner = config.runner;
      break;
    default:
      throw new Error("No runner specified!");
  }

  // Get the reporter module or function
  let reporter: Reporter;
  switch (typeof config.reporter) {
    case "string":
      reporter = await getModule<Reporter>(
        config.reporter,
        config.rootDir,
        DEFAULT_CONFIG.reporter
      );
      break;
    case "function":
      reporter = config.reporter;
      break;
    default:
      throw new Error("No reporter specified!");
  }

  const _config: Config = { ...(config as Config), runner, reporter };

  if (_config.verbose) {
    console.log("\n📣 Barbell running in verbose mode\n");
    console.log(_config);
  }

  if (!_config.testMatch || !_config.testMatch.length) {
    console.error(chalk.red("No glob patterns were given to find tests!"));
    process.exit(1);
  }

  const benches: string[] = utils.filterUnique(
    _config.testMatch.reduce((acc: string[], globPattern: string) => {
      const matchedBenches = glob.sync(globPattern, {
        cwd: _config.rootDir,
        ignore: _config.exclude,
        absolute: true,
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
  benches.forEach((benchPath) => _config.runner(benchPath, stack, _config));

  const benched: Bench[] = Object.values(stack);
  if (benched.length === 0) {
    console.error(chalk.red("\nNo bench test suites were created!"));
    process.exit();
  }

  const tasks = new Listr(
    // @ts-ignore
    benched.map((bench) => ({
      title: bench.relativePath,
      task: () => bench.output,
    })),
    {
      concurrent: _config.concurrent,
    }
  );

  tasks
    .run()
    .then(() => _config.reporter(stack, _config))
    .catch((error) => {
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

export default barbell;
