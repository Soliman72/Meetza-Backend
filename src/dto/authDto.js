const userDto = require("./userDto");

const loginResponse = (token) => ({
  token,
});

const registerResponse = (user) => ({
  name: user?.name,
  email: user?.email,
  role: user?.role,
});

module.exports = {
  loginResponse,
  registerResponse,
};
