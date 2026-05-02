exports.validateCreateMember = (body) => {
  const { user_id } = body || {};

  if (user_id == null || String(user_id).trim() === "") {
    throw { status: 400, message: "user_id is required" };
  }
};

exports.validateMemberIdParam = (id) => {
  if (id == null || String(id).trim() === "") {
    throw { status: 400, message: "user_id is required" };
  }
};

exports.validateUpdateMember = (user_id, new_user_id) => {
  exports.validateMemberIdParam(user_id);

  if (new_user_id == null || String(new_user_id).trim() === "") {
    throw { status: 400, message: "new_user_id is required" };
  }
};
