const functionToTest = (...inputs) => {
  return inputs.reduce((acc, input) => acc + input, 0);
};

suite("functionToTest", () => {
  test("1, 2", () => {
    functionToTest(1, 2);
  });

  test("1, 2, 4, 8, 16, 32", () => {
    functionToTest(1, 2, 4, 8, 16, 32);
  });

  test("1000000, 2000000, 3000000, 4000000, 5000000", () => {
    functionToTest(1000000, 2000000, 3000000, 4000000, 5000000);
  });
});
