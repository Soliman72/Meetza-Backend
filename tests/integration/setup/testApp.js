function createTestApp() {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "integration-test-secret";
  const { createApp } = require("../../../app");
  return createApp();
}

module.exports = { createTestApp };
