exports.validateAuthenticatedUser = (req) => {
  if (!(req.user && req.user.id !== undefined)) {
    throw { status: 401, message: "Unauthorized: user is not authenticated" };
  }
};

exports.validateCreatePosition = (req) => {
  exports.validateAuthenticatedUser(req);
  const { title } = req.body || {};
  if (!title || String(title).trim() === "") {
    throw { status: 400, message: "title and role are required" };
  }
};

exports.validateSuperAdminAdministratorId = (req) => {
  const { administrator_id } = req.body || {};
  if (req.user.role === "Super_Admin") {
    if (!administrator_id) {
      throw { status: 400, message: "administrator_id is required" };
    }
  }
};

exports.validatePositionIdParam = (id) => {
  if (!id || String(id).trim() === "") {
    throw { status: 400, message: "id is required" };
  }
};

exports.validateUpdatePosition = (id, body) => {
  exports.validatePositionIdParam(id);
  const { title } = body || {};
  if (!title || String(title).trim() === "") {
    throw {
      status: 400,
      message: "id in params and title in body are required",
    };
  }
};
