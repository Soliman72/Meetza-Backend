exports.validateGroupIdBody = (body) => {
  const { group_id } = body || {};
  if (group_id == null || String(group_id).trim() === "") {
    throw { status: 400, message: "group_id is required" };
  }
};

exports.validateMemberIdForAdmin = (req) => {
  const { member_id } = req.body || {};
  if (
    req.user.role === "Super_Admin" ||
    req.user.role === "Administrator"
  ) {
    if (member_id == null || String(member_id).trim() === "") {
      throw { status: 400, message: "member_id is required" };
    }
    return member_id;
  }
  return req.user.id;
};

exports.validateMembershipIdParam = (id) => {
  if (!id || String(id).trim() === "") {
    throw { status: 400, message: "id is required" };
  }
};

exports.validateUpdateMembership = (id, body) => {
  exports.validateMembershipIdParam(id);
  const { group_id } = body || {};
  if (group_id == null || String(group_id).trim() === "") {
    throw { status: 400, message: "id and group_id are required" };
  }
};
