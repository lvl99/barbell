# 🏋️‍ Barbell

Easily benchmark your code's performance via CLI using similar (but different) interface to Jest.

Uses [Benchmark JS](https://benchmarkjs.com/) under the hood.

[![Push your code to the limit!](http://img.youtube.com/vi/ueRzA9GUj9c/0.jpg)](http://www.youtube.com/watch?v=ueRzA9GUj9c)

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

Create `<filename>.bench.js` files within your codebase (if you like you can put it in a `__benches__` directory too):

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

@TODO put image of output

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
  barbell
```

## Contribute

Have suggestions, questions or feedback? Found a bug? [Post an issue](https://github.com/lvl99/barbell/issues)

Added a feature? Fixed a bug? [Post a PR](https://github.com/lvl99/barbell/compare)

## License

[MIT](LICENSE.md)
