const ADMIN_ROLES = ["Administrator", "Super_Admin"];

exports.validateCreateAdministrator = (body) => {
  const { user_id, role } = body || {};

  if (user_id == null || String(user_id).trim() === "") {
    throw { status: 400, message: "user_id is required" };
  }
  if (role == null || String(role).trim() === "") {
    throw { status: 400, message: "role is required" };
  }

  const roleTrim = String(role).trim();
  if (!ADMIN_ROLES.includes(roleTrim)) {
    throw { status: 400, message: "Invalid role" };
  }
};

exports.validateAdministratorIdParam = (id) => {
  if (id == null || String(id).trim() === "") {
    throw { status: 400, message: "user_id is required" };
  }
};

exports.validateUpdateAdministrator = (user_id, new_user_id, role) => {
  exports.validateAdministratorIdParam(user_id);

  if (new_user_id == null || String(new_user_id).trim() === "") {
    throw { status: 400, message: "new_user_id is required" };
  }
  if (role == null || String(role).trim() === "") {
    throw { status: 400, message: "role is required" };
  }

  const roleTrim = String(role).trim();
  if (!ADMIN_ROLES.includes(roleTrim)) {
    throw { status: 400, message: "Invalid role" };
  }
};
