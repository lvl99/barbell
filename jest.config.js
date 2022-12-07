module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.(spec|test).[jt]s"],
  collectCoverageFrom: ["lib/**/*.ts"],
  coverageReporters: ["text-summary", "html"],
  watchPathIgnorePatterns: ["<rootDir>/node_modules/"],
};
