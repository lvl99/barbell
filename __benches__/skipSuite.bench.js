function testFunction(...values) {
  return values.reduce((acc, val) => acc * val);
}

suite.skip("Skip suite", () => {
  test("testFunction(1, 2)", () => {
    testFunction(1, 2);
  });

  test("testFunction(1, 2, 4, 8, 16)", () => {
    testFunction(1, 2, 4, 8, 16);
  });

  test("testFunction(1, 2, 4, 8, 16, 32, 64, 128, 256)", () => {
    throw new Error("Whoops!");
  });
});
