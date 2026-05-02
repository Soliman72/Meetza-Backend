const userService = require("../services/userService");
const { success: resSuccess, error: resError } = require("../dto");

exports.createUser = async (req, res) => {
  try {
    const result = await userService.createUser(req);
    res.status(201).json(resSuccess(result));
  } catch (err) {
    res.status(400).json(resError(err.message));
  }
};

exports.createUserBySuperAdmin = async (req, res) => {
  try {
    const result = await userService.createUserBySuperAdmin(req);
    res.status(201).json(resSuccess(result));
  } catch (err) {
    res.status(400).json(resError(err.message));
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req);
    res.status(200).json(resSuccess(users));
  } catch (err) {
    res.status(500).json(resError(err.message));
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(resSuccess(user));
  } catch (err) {
    res.status(404).json(resError(err.message));
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const user = await userService.getUserByEmail(req.params.email);
    res.status(200).json(resSuccess(user));
  } catch (err) {
    res.status(404).json(resError(err.message));
  }
};

exports.updateUser = async (req, res) => {
  try {
    await userService.updateUser(req);
    res.status(200).json(resSuccess(null, "User updated"));
  } catch (err) {
    res.status(400).json(resError(err.message));
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json(resSuccess(null, "Deleted"));
  } catch (err) {
    res.status(404).json(resError(err.message));
  }
};