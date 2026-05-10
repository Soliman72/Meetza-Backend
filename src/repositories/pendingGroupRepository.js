const db = require("../config/db");

exports.createPendingGroup = async (data) => {
  const sql = `
    INSERT INTO pending_groups
    (id, group_name, description, group_photo, year, semester, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await db.promise().execute(sql, [
    data.id,
    data.group_name,
    data.description ?? null,
    data.group_photo ?? null,
    data.year,
    data.semester,
    data.created_by,
    data.status || "pending",
  ]);
};

exports.createPendingGroupAdmin = async (data) => {
  const sql = `
    INSERT INTO pending_group_admins
    (id, pending_group_id, user_id, role, assigned_by)
    VALUES (?, ?, ?, ?, ?)
  `;
  await db.promise().execute(sql, [
    data.id,
    data.pending_group_id,
    data.user_id,
    data.role || "ADMIN",
    data.assigned_by,
  ]);
};

exports.findPendingGroupById = async (id) => {
  const [rows] = await db.promise().execute(
    `SELECT pg.*
     FROM pending_groups pg
     WHERE pg.id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.getPendingGroups = async () => {
  const [rows] = await db.promise().execute(
    `SELECT pg.*, u.name AS created_by_name, u.email AS created_by_email
     FROM pending_groups pg
     JOIN user u ON u.id = pg.created_by
     WHERE pg.status = 'pending'
     ORDER BY pg.created_at DESC`
  );
  return rows;
};

exports.getPendingGroupAdmins = async (pendingGroupId) => {
  const [rows] = await db.promise().execute(
    `SELECT pga.*, u.name, u.email
     FROM pending_group_admins pga
     JOIN user u ON u.id = pga.user_id
     WHERE pga.pending_group_id = ?
     ORDER BY FIELD(pga.role, 'OWNER', 'ADMIN'), pga.created_at ASC`,
    [pendingGroupId]
  );
  return rows;
};

exports.updatePendingGroupStatus = async ({
  id,
  status,
  approvedBy = null,
  rejectedBy = null,
  rejectionReason = null,
}) => {
  await db.promise().execute(
    `UPDATE pending_groups
     SET status = ?,
         approved_by = COALESCE(?, approved_by),
         approved_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
         rejected_by = COALESCE(?, rejected_by),
         rejected_at = CASE WHEN ? = 'rejected' THEN CURRENT_TIMESTAMP ELSE rejected_at END,
         rejection_reason = ?
     WHERE id = ?`,
    [status, approvedBy, status, rejectedBy, status, rejectionReason, id]
  );
};

exports.deletePendingGroup = async (id) => {
  await db.promise().execute("DELETE FROM pending_groups WHERE id = ?", [id]);
};
