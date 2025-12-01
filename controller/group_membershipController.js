const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { getOwnershipFilter } = require("../utils/checkAdminPermission");

// Create
exports.createGroupMembership = async (req, res) => {
  try {
    const { group_id, member_id } = req.body;

    let memberId;
    if (!group_id ) {
      return res.status(400).json({ message: "group_id is required" });
    }

    if (req.user.role === "Super_Admin" || req.user.role === "Administrator") {
      if (!member_id) {
        return res.status(400).json({ message: "member_id is required" });
      }
      memberId = member_id;
    } else {
      memberId = req.user.id;
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
      .query("SELECT * FROM member WHERE user_id = ?", [memberId]);
    if (member.length === 0) {
      return res.status(400).json({ message: "Invalid member_id: not found" });
    }

    // check if the membership already exists
    const [existingMembership] = await db
      .promise()
      .query(
        "SELECT * FROM group_membership WHERE group_id = ? AND member_id = ?",
        [group_id, memberId]
      );
    if (existingMembership.length > 0) {
      return res.status(409).json({ message: "Membership already exists" });
    }

    const id = uuidv4();
    const sql =
      "INSERT INTO group_membership (id, group_id, member_id) VALUES (?, ?, ?)";
    const [result] = await db.promise().query(sql, [id, group_id, memberId]);
    res.status(201).json({ id: id, group_id, memberId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read all
exports.getAllGroupMemberships = async (req, res) => {
  try {
    // Compose query that retrieves group and all its members
    let query = `
      SELECT 
        g.id as group_id, 
        g.group_name as group_name,
        m.user_id as member_id,
        gm.id as membership_id,
        u.name as member_name,
        u.email as member_email,
        u.user_photo as member_photo
      FROM group_membership gm
      JOIN \`group\` g ON g.id = gm.group_id
      JOIN member m ON m.user_id = gm.member_id
      JOIN user u ON u.id = gm.member_id
    `;
    let params = [];

    // Apply ownership filter for regular admins
    const ownershipFilter = getOwnershipFilter(req, "g.administrator_id");
    if (ownershipFilter.whereClause) {
      query += " " + ownershipFilter.whereClause;
      params.push(...ownershipFilter.params);
    }

    const [rows] = await db.promise().query(query, params);

    // Transform to nested structure: [{group_id, group_name, members: [{member_id, member_name, member_email}]}]
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

    res.json(Object.values(groups));
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
