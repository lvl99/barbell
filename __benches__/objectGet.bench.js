const lodash = require("lodash");
const objectPath = require("object-path");
const objectGet = require("object-get");

const RE_VALID_NUMBERED_ARRAY_KEY = /^\d+$/;
const RE_OBJECT_PATH_PARTS = /\.|\[(\d+)\]/;
const RE_OBJECT_PATH_SPLIT = /\.|\[|\]\.?/;

function get(input, prop, defaultValue) {
  // Invalid input/prop given? Return defaultValue or undefined
  if (
    input === undefined ||
    input === null ||
    prop === undefined ||
    prop === null ||
    (typeof prop !== "string" &&
      typeof prop !== "number" &&
      !(prop instanceof Array)) ||
    (prop instanceof Array && !prop.length)
  ) {
    return defaultValue;
  }

  // Get value by prop
  if (typeof prop === "string" || (typeof prop === "number" && prop > -1)) {
    // First attempt... (works on both objects and arrays)
    if (prop in input) {
      return input[prop];
    }
    // Second attempt: convert key to number to test if in array
    else if (input instanceof Array && RE_VALID_NUMBERED_ARRAY_KEY.test(prop)) {
      let propName = parseInt(propName, 10);
      if (propName in input) {
        return input[propName];
      }
    }
  }

  // Get value by object path
  const path =
    prop instanceof Array
      ? prop
      : typeof prop === "string" && RE_OBJECT_PATH_PARTS.test(prop)
      ? prop.split(RE_OBJECT_PATH_SPLIT).filter(propPart => propPart)
      : undefined;

  if (!path) {
    return defaultValue;
  }

  if (path.length > 1) {
    return get(get(input, path[0]), path.slice(1));
  } else {
    return get(input, path[0]);
  }
}

const testObject = {
  testA: {
    testB: {
      testC: {
        testD: [
          {
            testE: true
          },
          {
            testF: {
              testG: {
                testH: {
                  testI: {
                    testJ: {
                      testK: {
                        testL: {
                          testM: [false, false, true]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    }
  }
};

suite("Get shallow prop from object (using string)", () => {
  test("lodash.get", () => {
    lodash.get(testObject, "testA");
  });

  test("objectPath.get", () => {
    objectPath.get(testObject, "testA");
  });

  test("objectGet", () => {
    objectGet(testObject, "testA");
  });

  test("My custom get function", () => {
    get(testObject, "testA");
  });
});

suite("Get shallow prop from object (using array)", () => {
  test("lodash.get", () => {
    lodash.get(testObject, ["testA"]);
  });

  test("objectPath.get", () => {
    objectPath.get(testObject, ["testA"]);
  });

  test.skip("objectGet (should be skipped)", () => {
    // Not supported by objectGet
    objectGet(testObject, ["testA"]);
  });

  test("My custom get function which shouldn't be skipped", () => {
    get(testObject, ["testA"]);
  });
});

suite("Get nested prop from object (using string)", () => {
  test("lodash.get", () => {
    lodash.get(testObject, "testA.testB.testC.testD[0].testE");
  });

  test("objectPath.get", () => {
    objectPath.get(testObject, "testA.testB.testC.testD.0.testE");
  });

  test("objectGet", () => {
    objectGet(testObject, "testA.testB.testC.testD[0].testE");
  });

  test("My custom get function", () => {
    get(testObject, "testA.testB.testC.testD[0].testE");
  });
});

suite("Get nested prop from object (using array)", () => {
  test("lodash.get", () => {
    lodash.get(testObject, ["testA", "testB", "testC", "testD", 0, "testE"]);
  });

  test("objectPath.get", () => {
    objectPath.get(testObject, [
      "testA",
      "testB",
      "testC",
      "testD",
      0,
      "testE"
    ]);
  });

  test.skip("objectGet", () => {
    // Not supported by objectGet
    objectGet(testObject, ["testA", "testB", "testC", "testD", 0, "testE"]);
  });

  test("My custom get function", () => {
    get(testObject, ["testA", "testB", "testC", "testD", 0, "testE"]);
  });
});

suite("Get deeply nested prop from object (using string)", () => {
  test("lodash.get", () => {
    lodash.get(
      testObject,
      "testA.testB.testC.testD[1].testF.testG.testH.testI.testJ.testK.testL.testM[2]"
    );
  });

  test("objectPath.get", () => {
    objectPath.get(
      testObject,
      "testA.testB.testC.testD[1].testF.testG.testH.testI.testJ.testK.testL.testM[2]"
    );
  });

  test("objectGet", () => {
    objectGet(
      testObject,
      "testA.testB.testC.testD[1].testF.testG.testH.testI.testJ.testK.testL.testM[2]"
    );
  });

  test("My custom get function", () => {
    get(
      testObject,
      "testA.testB.testC.testD[1].testF.testG.testH.testI.testJ.testK.testL.testM[2]"
    );
  });
});
