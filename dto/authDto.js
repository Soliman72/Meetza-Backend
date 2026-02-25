/**
 * Auth DTOs – login, register, token responses.
 */

const userDto = require("./userDto");

/**
 * Login success payload
 * @param {string} token - JWT
 * @param {object} user - user row from DB
 */
const loginResponse = (token, user) => ({
  token,
  user: userDto.toPublic(user),
});

/**
 * Register success payload (optional: no token until email verified)
 */
const registerResponse = (user) => ({
  name: user?.name,
  email: user?.email,
  role: user?.role,
});

module.exports = {
  loginResponse,
  registerResponse,
};
