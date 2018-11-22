const { addValues } = require("./required");

test.skip("standalone", () => {
  addValues(1, 2, 4, 8, 16, 32, 64, 128, 256, 512);
});
