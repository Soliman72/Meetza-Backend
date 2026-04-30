const { faker } = require("@faker-js/faker");

function makeUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: "StrongPass123!",
    role: "Member",
    ...overrides,
  };
}

function makeAuthPayload(overrides = {}) {
  return {
    email: faker.internet.email().toLowerCase(),
    password: "StrongPass123!",
    ...overrides,
  };
}

module.exports = {
  makeUser,
  makeAuthPayload,
};
