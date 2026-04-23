const administratorRepository = require("../repositories/administratorRepository");
const { getOwnershipFilter } = require("../middleware/checkAdminPermission");
const {
  validateCreateAdministrator,
  validateAdministratorIdParam,
  validateUpdateAdministrator,
} = require("../validators/administratorValidator");

exports.createAdministrator = async (req) => {
  validateCreateAdministrator(req.body);
  const { user_id, role } = req.body;

  const existing = await administratorRepository.findByUserId(user_id);
  if (existing) {
    throw new Error("Administrator already exists");
  }

  return administratorRepository.insert(user_id, role);
};

exports.getAllAdministrators = async (req) => {
  const ownershipFilter = getOwnershipFilter(req, "user_id");
  return administratorRepository.findAll(
    ownershipFilter.whereClause,
    ownershipFilter.params
  );
};

exports.getAdministratorById = async (user_id) => {
  validateAdministratorIdParam(user_id);
  const row = await administratorRepository.findByUserId(user_id);
  if (!row) {
    throw Object.assign(new Error("Administrator not found"), { status: 404 });
  }
  return row;
};

exports.updateAdministrator = async (user_id, new_user_id, role) => {
  validateUpdateAdministrator(user_id, new_user_id, role);
  const affected = await administratorRepository.updateByUserId(
    user_id,
    new_user_id,
    role
  );
  if (affected === 0) {
    throw Object.assign(new Error("Administrator not found"), { status: 404 });
  }
};

exports.deleteAdministrator = async (user_id) => {
  validateAdministratorIdParam(user_id);
  const existing = await administratorRepository.findByUserId(user_id);
  if (!existing) {
    throw Object.assign(new Error("Administrator not found"), { status: 404 });
  }
  await administratorRepository.deleteByUserId(user_id);
};
