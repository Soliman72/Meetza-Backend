const VALID_YEARS = ["1", "2", "3", "4"];
const VALID_SEMESTERS = ["Fall", "Spring", "Summer"];

const normalizeYear = (year) => String(year || "").trim();
const normalizeSemester = (semester) => String(semester || "").trim();

exports.normalizeGroupYear = normalizeYear;
exports.normalizeGroupSemester = normalizeSemester;

exports.validateCreateGroup = (data) => {
    const year = normalizeYear(data?.year);
    const semester = normalizeSemester(data?.semester);

    if (!data?.group_name || !year || !semester || !data?.group_content_name) {
      throw { status: 400, message: "Missing required fields" };
    }
    if (!VALID_YEARS.includes(year)) {
      throw { status: 400, message: "Invalid year" };
    }
    if (!VALID_SEMESTERS.includes(semester)) {
      throw { status: 400, message: "Invalid semester" };
    }
  };

exports.validateUpdateGroup = (req) => {
    const body = req.body || {};
    const { group_name, description } = body;
    const year = normalizeYear(body.year);
    const semester = normalizeSemester(body.semester);
    const { group_photo } = req.files || {};
    if(
        !group_name &&
        !description &&
        !group_photo &&
        !body.group_photo &&
        body.year === undefined &&
        body.semester === undefined
    ) {
        throw { status: 400, message: "No fields provided" };
    }
    if (body.year !== undefined && !VALID_YEARS.includes(year)) {
      throw { status: 400, message: "Invalid year" };
    }
    if (body.semester !== undefined && !VALID_SEMESTERS.includes(semester)) {
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
