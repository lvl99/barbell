#!/usr/bin/env node

const pkg = require("./package.json");
const program = require("commander");
const barbell = require("./lib/barbell");

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
    collect
  )
  .option(
    "-e, --exclude [globPatterns...]",
    "Exclude specific files and folders",
    collect
  )
  .option(
    "-s, --stop-on-errors",
    "Stop Barbell if any errors are found within test suites"
  );

program.action(barbell);

program.parse(process.argv);
