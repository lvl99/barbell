import * as utils from "../lib/utils";

describe("round", () => {
  it("should round to the specified decimal place", () => {
    expect(utils.round(1.23456789, 1)).toBe(1.2);
    expect(utils.round(1.23456789, 2)).toBe(1.23);
    expect(utils.round(1.23456789, 3)).toBe(1.235);
    expect(utils.round(1.23456789, 4)).toBe(1.2346);
    expect(utils.round(1.23456789, 5)).toBe(1.23457);
    expect(utils.round(1.23456789, 6)).toBe(1.234568);
    expect(utils.round(1.23456789, 7)).toBe(1.2345679);
    expect(utils.round(1.23456789, 8)).toBe(1.23456789);
  });
});

describe("toArray", () => {
  it("should turn non-nil input into an array", () => {
    const testToArrayBoolean = utils.toArray(false);
    expect(testToArrayBoolean).toBeInstanceOf(Array);
    expect(testToArrayBoolean).toHaveLength(1);
    expect(testToArrayBoolean[0]).toBe(false);

    const testToArrayNumber = utils.toArray(123);
    expect(testToArrayNumber).toBeInstanceOf(Array);
    expect(testToArrayNumber).toHaveLength(1);
    expect(testToArrayNumber[0]).toBe(123);

    const testToArrayString = utils.toArray("test");
    expect(testToArrayString).toBeInstanceOf(Array);
    expect(testToArrayString).toHaveLength(1);
    expect(testToArrayString[0]).toBe("test");

    const testObject = {};
    const testToArrayObject = utils.toArray(testObject);
    expect(testToArrayObject).toBeInstanceOf(Array);
    expect(testToArrayObject).toHaveLength(1);
    expect(testToArrayObject[0]).toBe(testObject);
  });

  it("should turn nil input into an empty array", () => {
    const testToArrayUndefined = utils.toArray(undefined);
    expect(testToArrayUndefined).toBeInstanceOf(Array);
    expect(testToArrayUndefined).toHaveLength(0);

    const testToArrayNull = utils.toArray(null);
    expect(testToArrayNull).toBeInstanceOf(Array);
    expect(testToArrayNull).toHaveLength(0);
  });

  it("should not turn array input into an array within an array", () => {
    const testToArray = utils.toArray(["test"]);
    expect(testToArray).toBeInstanceOf(Array);
    expect(testToArray).toHaveLength(1);
    expect(testToArray[0]).toBe("test");
  });
});

describe("useFirstValid", () => {
  it("should use the first valid value as per the validation function", () => {
    expect(utils.useFirstValid((x) => x === 3, 1, 2, 3)).toEqual(3);
  });

  it("should use the last item, even if it doesn't match validation", () => {
    expect(utils.useFirstValid((x) => x === 3, 1, 2, 4)).toEqual(4);
  });
});

describe("useFirstDefined", () => {
  it("should use the first defined value", () => {
    expect(utils.useFirstDefined(undefined, undefined, 3)).toEqual(3);
  });

  it("should use the last item, even if it is empty", () => {
    expect(utils.useFirstDefined(undefined, undefined)).toBeUndefined();
  });
});

describe("useFirstNonEmptyArray", () => {
  it("should use the first array which is not empty", () => {
    expect(utils.useFirstNonEmptyArray([], [], [1, 2, 3])).toEqual(
      expect.arrayContaining([1, 2, 3])
    );
  });

  it("should use the last array, even if it is empty", () => {
    const lastArray: any[] = [];
    expect(utils.useFirstNonEmptyArray([], [], lastArray)).toEqual(lastArray);
  });
});

describe("formatNumber", () => {
  it("should format large numbers with commas", () => {
    expect(utils.formatNumber(123456789)).toBe("123,456,789");
  });

  it("should format numbers with decimal places", () => {
    expect(utils.formatNumber(12345.6789)).toBe("12,345.6789");
  });
});

describe("formatTimeDuration", () => {
  it("should format zero", () => {
    expect(utils.formatTimeDuration(0)).toBe("0 ms");
  });

  it("should format milliseconds", () => {
    expect(utils.formatTimeDuration(999)).toBe("999 ms");
  });

  it("should format seconds", () => {
    expect(utils.formatTimeDuration(1000)).toBe("1 s");
    expect(utils.formatTimeDuration(1000 * 5)).toBe("5 s");
    expect(utils.formatTimeDuration(1000 * 30)).toBe("30 s");
    expect(utils.formatTimeDuration(1000 * 45)).toBe("45 s");
  });

  it("should format minutes", () => {
    expect(utils.formatTimeDuration(1000 * 60)).toBe("1 m");
    expect(utils.formatTimeDuration(1000 * 60 * 2)).toBe("2 m");
    expect(utils.formatTimeDuration(1000 * 60 * 10.5)).toBe("10.5 m");
  });

  it("should format hours", () => {
    expect(utils.formatTimeDuration(1000 * 60 * 60)).toBe("1 h");
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 2)).toBe("2 h");
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 12)).toBe("12 h");
  });

  it("should format days", () => {
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 2)).toBe("2 d");
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 5)).toBe("5 d");
  });

  it("should format weeks", () => {
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 7)).toBe("1 w");
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 7 * 2)).toBe("2 w");
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 7 * 2.5)).toBe(
      "2.5 w"
    );
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 7 * 3.75)).toBe(
      "3.75 w"
    );
  });

  it("should format months", () => {
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 30)).toBe("1 mo");
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 30 * 2)).toBe("2 mo");
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 30 * 2.5)).toBe(
      "2.5 mo"
    );
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 30 * 5.5)).toBe(
      "5.5 mo"
    );
    expect(utils.formatTimeDuration(1000 * 60 * 60 * 24 * 30 * 11.5)).toBe(
      "11.5 mo"
    );
  });
});
