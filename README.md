# 🏋️‍ Barbell 🏋️‍♀️

Easily benchmark your code's performance via CLI using similar (but different) interface to Jest.

Uses [Benchmark JS](https://benchmarkjs.com/) under the hood.

## Why?

I wanted something like Jest but for performance testing:

- It's good to test how performant your code is within an isolated JS environment.
- Helps developers to be aware of how slow/fast their code is.
- Set expectations on code performance to see if your code meets them (see [v0.2.0 To do](https://github.com/lvl99/barbell/projects/1)).

> **Note:** Barbell performs tests within a Node.JS environment, not within a browser. If you want to test within a browser, use [Benchmark JS](https://benchmarkjs.com/) or [jsPerf](https://jsperf.com/) (see [v0.2.0 To do](https://github.com/lvl99/barbell/projects/1)).

## Installation

```sh
# npm
npm i barbell --save-dev

# yarn
yarn add barbell --dev
```

## Usage

Create `<filename>.bench.js` files within your codebase (if you like you can put it in a `__benches__` directory too).

Each bench file can contain benchmark test suites and individual tests. Think of a suite as a group of tests that you want to compare, whereas a single stand-alone test would just be for getting an idea of its performance.

```javascript
// __benches__/example.bench.js

const functionToTest = (...inputs) => {
  return inputs.reduce((acc, input) => acc + input, 0);
};

suite("some code I want to test", () => {
  test("test variant #1", () => {
    functionToTest(1, 2);
  });

  test("test variant #2", () => {
    functionToTest(1, 2, 4, 8, 16, 32);
  });

  test("test variant #3", () => {
    functionToTest(1000000, 2000000, 3000000, 4000000, 5000000);
  });
});
```

Then run `barbell` in your terminal to see your results:

![Barbell in action](//unpkg.com/barbell@0.1.3/screenshot.gif)

## CLI options

There are some configuration options available on the CLI:

```
> barbell -h
Usage: barbell [testMatch...] [options]

Options:
  -V, --version                       output the version number
  -c, --config <path>                 Set path to config file
  -t, --test-match <globPatterns...>  Set the test match glob(s) to detect
                                      benchmark tests or test file paths
                                      (default: [
                                        "**/__benches__/**/*(.bench)?.[tj]s",
                                        "**/*.bench.[tj]s"
                                      ])
  -e, --exclude <globPatterns...>     Exclude specific files and folders
                                      (default: ["**/node_modules/**/*"])
  -C, --concurrent                    The number of benches you want to run
                                      at the same time
                                      (default: 2)
  -x, --stop-on-errors                Stop Barbell if any errors are found
                                      within test suites
                                      (default: false)
  -v, --verbose                       Verbose mode (outputs config settings)
                                      (default: false)
  -r, --runner <nameOrPath>           Name or path to test runner
                                      (default: barbell-runner)
  -R, --reporter <nameOrPath>         Name or path to test reporter
                                      (default: barbell-reporter)
  -h, --help                          output usage information
```

### Examples

> Note: always wrap globs with quote marks!

```bash
# Find and run test suite files with default config
> barbell "**/__benches__/**/*.bench.js"

# Specify multiple test match glob patterns
> barbell -t "**/__benches__/**.*.bench.js" -t "**/__tests__/**/*.bench.js"

# Run a single test file with default config
> barbell "./__benches__/example.bench.js"

# Specify a config file
> barbell -c "./barbell.config.js"
```

## Configuration

Aside from the CLI options, you can also configure via an external `barbell.config.*` file (supported file formats are `js`, `json`, `yml` and `yaml`).

Barbell will automatically detect and use the `barbell.config.*` file that's in the current working directory, unless you specify a specific path to another.

```javascript
module.exports = {
  // The root directory where barbell is running the benches
  rootDir: process.cwd(),

  // The glob patterns to find bench files or specific bench files to run
  // See npm module `glob` for more info
  testMatch: ["**/__benches__/**/*(.bench)?.[tj]s", "**/*.bench.[tj]s"],

  // Glob patterns or paths of files/folders to exclude from running
  // See npm module `glob`'s option `exclude` for more info
  exclude: ["**/node_modules/**/*"],

  // The maximum number of benches to run at the same time
  concurrent: 2,

  // Stop barbell if any errors in test suites occur
  stopOnErrors: false,

  // Verbose mode (outputs config settings)
  verbose: false,

  // Advanced: the package name, script path or custom function to run bench files with
  // See ./lib/runner.ts for more info
  runner: "barbell-runner",

  // Advanced: the package name, script path or custom function to output a report
  // See ./lib/reporter.ts for more info
  reporter: "barbell-reporter",

  // Advanced: extra configuration for the reporter.
  // See ./lib/reporter.ts for more info
  reporterConfig: {},
};
```

## Development

To download external dependencies:

```bash
  npm i
```

To run tests (using Jest):

```bash
  npm run test
```

To run benchmark tests:

```bash
  npm run bench
```

## Contribute

Have suggestions, questions or feedback? Found a bug? [Post an issue](https://github.com/lvl99/barbell/issues)
Added a feature? Fixed a bug? [Post a PR](https://github.com/lvl99/barbell/compare)

## License

[Apache-2.0](LICENSE.md)
