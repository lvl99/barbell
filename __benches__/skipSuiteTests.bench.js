const { addValues } = require("./required");

suite("addValues()", () => {
  test.skip("addValues(1, 1)", () => {
    addValues(1, 1);
  });

  test("addValues(1, 2)", () => {
    addValues(1, 2);
  });

  test.skip("addValues(1, 3)", () => {
    addValues(1, 3);
  });
});
