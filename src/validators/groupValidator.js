exports.validateUpdateGroup = (data) => {
    if (data.year && !["1", "2", "3", "4"].includes(data.year)) {
      throw { status: 400, message: "Invalid year" };
    }
  };

exports.validateCreateGroup = (data) => {
    if (!data.group_name || !data.year || !data.semester || !data.group_content_name) {
      throw { status: 400, message: "Missing required fields" };
    }
    if (!["1", "2", "3", "4"].includes(data.year)) {
      throw { status: 400, message: "Invalid year" };
    }
    if (!["Fall", "Spring", "Summer"].includes(data.semester)) {
      throw { status: 400, message: "Invalid semester" };
    }
  };

exports.validateUpdateGroup = (req) => {
    const { group_name, description, year, semester } = req.body;
    const { group_photo } = req.files || {};
    if(
        !group_name &&
        !description &&
        !group_photo &&
        !req.body?.group_photo &&
        !year &&
        !semester
    ) {
        throw { status: 400, message: "No fields provided" };
    }
    if (year && !["1", "2", "3", "4"].includes(year)) {
      throw { status: 400, message: "Invalid year" };
    }
    if (data.semester && !["Fall", "Spring", "Summer"].includes(data.semester)) {
      throw { status: 400, message: "Invalid semester" };
    }
  };

exports.validateAddAdmin = (data) => {
    const {groupId, userId, role} = data;
    if(!groupId || !userId || !role) {
        throw { status: 400, message: "Missing required fields" };
    }
    if(!["OWNER", "ADMIN"].includes(role)) {
        throw { status: 400, message: "Invalid role" };
    }
}

exports.validateRemoveAdmin = (data) => {
    const {groupId, userId, role} = data;
    if(!groupId || !userId) {
        throw { status: 400, message: "Missing required fields" };
    }
    if(role !== "OWNER" && role !== "ADMIN") {
        throw { status: 400, message: "Invalid role" };
    }
}

exports.validateLeaveGroup = (data) => {
    const {groupId, userId} = data;
    if(!groupId || !userId) {
        throw { status: 400, message: "Missing required fields" };
    }
}
