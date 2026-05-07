const userRepo = require("../repositories/userRepository");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { getOwnershipFilter } = require("../middleware/checkAdminPermission");
const { uploadToCloudinary } = require("../middleware/uploadFile");
const { validateFileType } = require("../validators/validateFiles");
const userDto = require("../dto/userDto");
const userValidator = require("../validators/userValidator");

exports.createUser = async (req) => {
  userValidator.validateCreateUserBody(req.body);
  const { name, email, password, role, verification_code, email_verification } = req.body;

  const exists = await userRepo.findByEmail(email);
  if (exists) throw new Error("User already exists");

  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  await userRepo.create({
    id,
    name,
    email,
    password: hashedPassword,
    role,
    verification_code,
    email_verification,
  });

  return { id, name, email, role };
};

exports.getAllUsers = async (req) => {
  const { name } = req.query;
  const ownershipFilter = getOwnershipFilter(req, "id");

  const users = await userRepo.findAll(name, ownershipFilter);
  return userDto.toPublicListWithRole(users);
};

exports.getUserById = async (id) => {
  userValidator.validateUserIdParam(id);
  const user = await userRepo.findById(id);
  if (!user) throw new Error("User not found");
  return userDto.toPublic(user);
};

exports.getUserByEmail = async (email) => {
  userValidator.validateUserEmailParam(email);
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error("User not found");
  return userDto.toPublicWithRole(user);
};

exports.updateUser = async (req) => {
  const { id } = req.params;
  userValidator.validateUserIdParam(id);

  let user_photo_url;


  if (req.files?.user_photo) {
    const file = req.files.user_photo[0];
    validateFileType(file, "image");
    user_photo_url = await uploadToCloudinary(file, "posters");
  }

  const theme = req.body.theme;
  const supportedThemes = ["light", "dark"];
  if (theme && !supportedThemes.includes(theme)) {
    throw new Error("Invalid theme. Supported themes: light, dark");
  }

  const updateData = Object.fromEntries(
    Object.entries(req.body || {}).filter(([, value]) => value !== undefined)
  );

  if (user_photo_url !== undefined) {
    updateData.user_photo = user_photo_url;
  }

  await userRepo.update(id, updateData);
};

exports.deleteUser = async (id) => {
  userValidator.validateUserIdParam(id);
  const deleted = await userRepo.delete(id);
  if (!deleted) throw new Error("User not found");
};

exports.createUserBySuperAdmin = async (req) => {
  userValidator.validateCreateUserBody(req.body);
  const { name, email, password, role } = req.body;

  const exists = await userRepo.findByEmail(email);
  if (exists) throw new Error("User already exists");

  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  await userRepo.createUserBySuperAdmin({
    id,
    name,
    email,
    password: hashedPassword,
    role,
  });

  return { id, name, email, role };
};