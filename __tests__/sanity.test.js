const barbell = require("../dist/index");

it("should work as commonjs module", () => {
  expect(barbell).toHaveProperty("default");
});
