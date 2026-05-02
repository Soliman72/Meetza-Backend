require("dotenv").config();

if (typeof beforeAll === "function") {
  beforeAll(async () => {
    // Intentionally empty for now.
    // Integration tests prepare data inside each suite.
  });

  afterEach(async () => {
    // Intentionally empty for now.
  });

  afterAll(async () => {
    // Intentionally empty for now.
  });
}
