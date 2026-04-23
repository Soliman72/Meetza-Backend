const { v4: uuidv4 } = require("uuid");
const repo = require("../repositories/group_memberShipRepository");
const groupMembershipValidator = require("../validators/groupMembershipValidator");

function nestGroupedRows(rows) {
  const groups = {};
  rows.forEach((row) => {
    if (!groups[row.group_id]) {
      groups[row.group_id] = {
        group_id: row.group_id,
        group_name: row.group_name,
        members: [],
      };
    }
    groups[row.group_id].members.push({
      membership_id: row.membership_id,
      member_id: row.member_id,
      member_name: row.member_name,
      member_email: row.member_email,
      member_photo: row.member_photo,
    });
  });
  return Object.values(groups);
}

exports.createGroupMembership = async (req) => {
  groupMembershipValidator.validateGroupIdBody(req.body);
  const { group_id } = req.body;
  const memberId = groupMembershipValidator.validateMemberIdForAdmin(req);

  const group = await repo.findGroupById(group_id);
  if (!group) {
    throw { status: 400, message: "Invalid group_id: not found" };
  }

  const member = await repo.findMemberByUserId(memberId);
  if (!member) {
    throw { status: 400, message: "Invalid member_id: not found" };
  }

  const exists = await repo.exists(group_id, memberId);
  if (exists) {
    throw { status: 409, message: "Membership already exists" };
  }

  const id = uuidv4();
  await repo.insert({ id, group_id, member_id: memberId });
  return { id, group_id, memberId };
};

exports.getAllGroupMemberships = async (req) => {
  const rows = await repo.getAllGroupedRows(req.user.id, req.user.role);
  return nestGroupedRows(rows);
};

exports.getGroupMembershipById = async (id) => {
  groupMembershipValidator.validateMembershipIdParam(id);
  const row = await repo.findById(id);
  if (!row) {
    throw { status: 404, message: "Record not found" };
  }
  return row;
};

exports.updateGroupMembership = async (id, body) => {
  groupMembershipValidator.validateUpdateMembership(id, body);
  const affected = await repo.updateGroupId(id, body.group_id);
  if (affected === 0) {
    throw { status: 404, message: "Record not found" };
  }
};

exports.deleteGroupMembership = async (id) => {
  groupMembershipValidator.validateMembershipIdParam(id);
  const affected = await repo.deleteById(id);
  if (!affected) {
    throw { status: 404, message: "Record not found" };
  }
};
