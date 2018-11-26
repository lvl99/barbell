#!/usr/bin/env node --harmony

const pkg = require("./package.json");
const program = require("commander");
const barbell = require("./lib/barbell");

function setConcurrent(val) {
  return parseInt(val, 10) || barbell.defaultConfig.concurrent;
}

function collect(val, memo = []) {
  if (!(memo instanceof Array)) {
    memo = [];
  }
  memo.push(val);
  return memo;
}

program
  .version(pkg.version)
  .arguments("[testMatch...]")
  .option("-c, --config <path>", "Set path to config file")
  .option(
    "-t, --test-match [globPatterns...]",
    "Set the test match glob pattern(s) to detect benchmark tests or test file paths",
    collect,
    barbell.defaultConfig.testMatch.slice(0)
  )
  .option(
    "-e, --exclude [globPatterns...]",
    "Exclude specific files and folders",
    collect,
    barbell.defaultConfig.exclude.slice(0)
  )
  .option(
    "-C, --concurrent",
    "The number of benches you want to run at the same time",
    setConcurrent,
    barbell.defaultConfig.concurrent
  )
  .option(
    "-x, --stop-on-errors",
    "Stop Barbell if any errors are found within test suites"
  )
  .option("-v, --verbose", "Verbose mode (outputs config settings)");

program.action(barbell);

program.parse(process.argv);
