module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  globalSetup: "<rootDir>/tests/globalSetup.js",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  collectCoverageFrom: [
    "src/services/**/*.js",
    "src/utils/**/*.js",
    "src/validators/**/*.js",
    "src/middleware/**/*.js",
    "src/controllers/**/*.js",
  ],
  projects: [
    {
      displayName: "unit",
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
    },
    {
      displayName: "integration",
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
    },
  ],
};
