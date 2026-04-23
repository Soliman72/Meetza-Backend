const { v4: uuidv4 } = require("uuid");
const { getOwnershipFilter } = require("../middleware/checkAdminPermission");
const positionRepository = require("../repositories/positionRepository");
const positionValidator = require("../validators/positionValidator");

exports.createPosition = async (req) => {
  positionValidator.validateCreatePosition(req);
  positionValidator.validateSuperAdminAdministratorId(req);

  let admin_id;
  if (req.user.role === "Super_Admin") {
    admin_id = req.body.administrator_id;
  } else if (req.user.role === "Administrator") {
    admin_id = req.user.id;
  } else {
    throw { status: 400, message: "Invalid role" };
  }

  const adminOk = await positionRepository.administratorExists(admin_id);
  if (!adminOk) {
    throw { status: 400, message: "Invalid administrator_id: not found" };
  }

  const id = uuidv4();
  const { title } = req.body;
  await positionRepository.insert(id, title, admin_id);
  return { id, title, administrator_id: admin_id };
};

exports.getAllPositions = async (req) => {
  const { title } = req.query;
  const ownershipFilter = getOwnershipFilter(req, "administrator_id");
  return positionRepository.findAll(
    ownershipFilter.whereClause || "",
    ownershipFilter.params,
    title || null
  );
};

exports.getPositionById = async (req) => {
  const { id } = req.params;
  positionValidator.validatePositionIdParam(id);
  const row = await positionRepository.findByIdScoped(
    id,
    req.administratorId ?? req.user?.id,
    !!req.isSuperAdmin
  );
  if (!row) {
    throw { status: 404, message: "Record not found" };
  }
  return row;
};

exports.updatePosition = async (req) => {
  const { id } = req.params;
  positionValidator.validateUpdatePosition(id, req.body);
  const { title } = req.body;
  const affected = await positionRepository.updateTitle(id, title);
  if (affected === 0) {
    throw { status: 404, message: "Record not found" };
  }
  return { id, title };
};

exports.deletePosition = async (id) => {
  positionValidator.validatePositionIdParam(id);
  const affected = await positionRepository.deleteById(id);
  if (affected === 0) {
    throw { status: 404, message: "Record not found" };
  }
};
