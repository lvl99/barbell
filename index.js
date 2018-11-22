#!/usr/bin/env node

const pkg = require("./package.json");
const program = require("commander");
const barbell = require("./lib/cmd");

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
    "Set the test match glob(s) to detect benchmark tests",
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
    "-c, --concurrent",
    "The number of benches you want to run at the same time",
    undefined,
    barbell.defaultConfig.concurrent
  )
  .option(
    "-x, --stop-on-errors",
    "Stop Barbell if any errors are found within test suites"
  )
  .option("-v, --verbose", "Verbose mode");

program.action(barbell);

program.parse(process.argv);
