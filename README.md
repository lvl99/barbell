# 🏋️‍ Barbell

Easily benchmark your code's performance via CLI using similar (but different) interface to Jest.

Uses [Benchmark JS](https://benchmarkjs.com/) under the hood.

## Why?

I wanted something like Jest but for performance testing:

- It's good to test how performant your code is within an isolated JS environment.
- Helps developers to be aware of how slow/fast their code is.
- Set expectations on code performance to see if your code meets them (see [To Do](#to-do)).

> **Note:** Barbell performs tests within a Node.JS environment, not within a browser. If you want to test within a browser, use [Benchmark JS](https://benchmarkjs.com/) or [jsPerf](https://jsperf.com/).

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
}

suite("some code I want to test", () => {
  test("test variant #1", () => {
    functionToTest(1, 2)
  })

  test("test variant #2", () => {
    functionToTest(1, 2, 4, 8, 16, 32)
  })

  test("test variant #3", () => {
    functionToTest(1000000, 2000000, 3000000, 4000000, 5000000)
  })
})
```

Then run `barbell` in your terminal to see your results:

![Barbell in action](/screenshot.gif)

## CLI options

There are some configuration options available on the CLI:

```
> barbell -h
Usage: barbell [options] [testMatch...]

Options:
  -V, --version                       output the version number
  -c, --config <path>                 Set path to config file
  -t, --test-match [globPatterns...]  Set the test match glob(s) to detect
                                      benchmark tests or test file paths
                                      (default: ["**/?(__(tests|benches)__)/**/*.bench.?(t|j)s?(x)","**/*.bench.?(t|j)s?(x)"])
  -e, --exclude [globPatterns...]     Exclude specific files and folders
                                      (default: ["node_modules"])
  -C, --concurrent                    The number of benches you want to run at
                                      the same time
                                      (default: 2)
  -x, --stop-on-errors                Stop Barbell if any errors are found
                                      within test suites
                                      (default: false)
  -v, --verbose                       Verbose mode (outputs config settings)
  -h, --help                          output usage information
```

### Examples

```bash
# Find and run test suite files with default config
> barbell **/__benches__/**/*.bench.js

# Specify multiple test match glob patterns
> barbell -t **/__benches__/**.*.bench.js -t **/__tests__/**/*.bench.js

# Run a single test file with default config
> barbell ./__benches__/example.bench.js

# Specify a config file
> barbell -c ./barbell.config.js
```

## Configuration

Aside from the CLI options, you can also configure via an external `barbell.config.*` file (supported file formats are `js`, `json`, `yml` and `yaml`).

```javascript
  module.exports = {
    // The root directory where barbell is running the benches
    rootDir: process.cwd(),

    // The glob patterns to find bench files or specific bench files to run
    // see npm module `glob` for more info
    testMatch: [
      "**/?(__(tests|benches)__)/**/*.bench.?(t|j)s?(x)",
      "**/*.bench.?(t|j)s?(x)"
    ],

    // Glob patterns or paths of files/folders to exclude from running
    // see npm module `glob`'s option `exclude` for more info
    exclude: ["node_modules"],

    // The maximum number of benches to run at the same time
    concurrent: 2,

    // Stop barbell if any errors in test suites occur
    stopOnErrors: false,

    // Verbose mode (outputs config settings)
    verbose: false,

    // Advanced: the package, script or function to run bench files with
    runner: "barbell/lib/runner",

    // Advanced: the package, script or function to output a report
    reporter: "barbell/lib/reporter"
  }
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
  node index.js
```

## Contribute

Have suggestions, questions or feedback? Found a bug? [Post an issue](https://github.com/lvl99/barbell/issues)

Added a feature? Fixed a bug? [Post a PR](https://github.com/lvl99/barbell/compare)

## License

[MIT](LICENSE.md)
