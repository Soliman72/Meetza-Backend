/**
 * DTO layer – for user only (userDto, authDto) + (success, error, paginated).
 */

const response = require("./response");
const userDto = require("./userDto");
const authDto = require("./authDto");

module.exports = {
  ...response,
  userDto,
  authDto,
};
