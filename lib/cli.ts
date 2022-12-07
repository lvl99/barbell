#!/usr/bin/env node

import { program } from "commander";
import pkg from "../package.json";
import barbell, { DEFAULT_CONFIG } from "./barbell";

function setConcurrent(val: any) {
  return parseInt(val as string, 10) || DEFAULT_CONFIG.concurrent;
}

function collect(val: any, memo: any[] = []) {
  if (!(memo instanceof Array)) {
    memo = [];
  }
  memo.push(val);
  return memo;
}

export const cli = program
  .version(pkg.version)
  .arguments("[testMatch...]")
  .option("-c, --config <path>", "Set path to config file")
  .option(
    "-t, --test-match <globPatterns...>",
    "Set the test match glob pattern(s) to detect benchmark tests or test file paths",
    collect,
    DEFAULT_CONFIG.testMatch.slice(0)
  )
  .option(
    "-e, --exclude <globPatterns...>",
    "Exclude specific files and folders",
    collect,
    DEFAULT_CONFIG.exclude.slice(0)
  )
  .option(
    "-C, --concurrent",
    "The number of benches you want to run at the same time",
    setConcurrent,
    DEFAULT_CONFIG.concurrent
  )
  .option(
    "-x, --stop-on-errors",
    "Stop Barbell if any errors are found within test suites",
    DEFAULT_CONFIG.stopOnErrors
  )
  .option(
    "-v, --verbose",
    "Verbose mode (outputs config settings)",
    DEFAULT_CONFIG.verbose
  )
  .option(
    "-r, --runner <nameOrPath>",
    "Name or path to test runner",
    DEFAULT_CONFIG.runner
  )
  .option(
    "-R, --reporter <nameOrPath>",
    "Name or path to test reporter",
    DEFAULT_CONFIG.reporter
  )
  .action(barbell)
  .parse(process.argv);

export default cli;
