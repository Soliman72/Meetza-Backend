const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");

// Create
exports.createGroupMembership = async (req, res) => {
  try {
    const { group_id, member_id } = req.body;

    if (!group_id || !member_id) {
      return res.status(400).json({ message: "group_id is required" });
    }

    // Check if the group already exists
    const [group] = await db
      .promise()
      .query("SELECT * FROM `group` WHERE id = ?", [group_id]);
    if (group.length === 0) {
      return res.status(400).json({ message: "Invalid group_id: not found" });
    }

    // check if the member already exists
    const [member] = await db
      .promise()
      .query("SELECT * FROM member WHERE user_id = ?", [member_id]);
    if (member.length === 0) {
      return res.status(400).json({ message: "Invalid member_id: not found" });
    }

    // check if the membership already exists
    const [existingMembership] = await db
      .promise()
      .query(
        "SELECT * FROM group_membership WHERE group_id = ? AND member_id = ?",
        [group_id, member_id]
      );
    if (existingMembership.length > 0) {
      return res.status(409).json({ message: "Membership already exists" });
    }

    const id = uuidv4();
    const sql =
      "INSERT INTO group_membership (id, group_id, member_id) VALUES (?, ?, ?)";
    const [result] = await db.promise().query(sql, [id, group_id, member_id]);
    res.status(201).json({ id: id, group_id, member_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all
exports.getAllGroupMemberships = async (req, res) => {
  try {
    let query = "SELECT * FROM group_membership";
    let params = [];

    // Apply ownership filter for regular admins
    const ownershipFilter = getOwnershipFilter(req, "group.administrator_id");

    if (ownershipFilter.whereClause) {
      query =
        "SELECT group_membership.group_id , user.name , user.email FROM group_membership";
      query +=
        " JOIN user ON user.id = group_membership.member_id JOIN `group` ON `group`.id = group_membership.group_id";
      query += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    const [rows] = await db.promise().query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read by id
exports.getGroupMembershipById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
    const [rows] = await db
      .promise()
      .query("SELECT * FROM group_membership WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Record not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
exports.updateGroupMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { group_id } = req.body;
    if (!id || !group_id) {
      return res.status(400).json({ message: "id and group_id are required" });
    }
    const sql = "UPDATE group_membership SET group_id = ? WHERE id = ?";
    const [result] = await db.promise().query(sql, [group_id, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json({ message: "Group membership updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete
exports.deleteGroupMembership = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
    const sql = "DELETE FROM group_membership WHERE id = ?";
    const [result] = await db.promise().query(sql, [id]);
    res.json({ message: "Group membership deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
