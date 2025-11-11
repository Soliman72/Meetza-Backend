const db = require("../config/db");

/**
 * Middleware to check if user is super admin or regular admin
 * Super admin can access all data
 * Regular admin can only access their own data
 */
exports.checkAdminPermission = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    // Check if user is an Administrator or Super_Admin
    if (req.user.role !== "Administrator" && req.user.role !== "Super_Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrators or Super Admins only.",
      });
    }

    // Fetch administrator details to check admin role
    const [adminRows] = await db
      .promise()
      .query("SELECT * FROM administrator WHERE user_id = ?", [req.user.id]);

    let adminRole = req.user.role;

    // If administrator record exists, check the role in administrator table
    if (adminRows.length > 0) {
      const adminRecord = adminRows[0];
      adminRole = adminRecord.role;
      // Super_Admin can be determined from either user table or administrator table
      isSuperAdmin = adminRole === "Super_Admin";
    } else {
      // If no administrator record exists but user is Super_Admin, allow access
      if (!isSuperAdminFromUserTable) {
        return res.status(403).json({
          success: false,
          message: "Administrator record not found",
        });
      }
    }

    // Add admin info to request object
    req.isSuperAdmin = isSuperAdmin;
    req.adminRole = adminRole;
    req.administratorId = req.user.id;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking admin permissions",
      error: error.message,
    });
  }
};

/**
 * Middleware to check ownership for update/delete operations
 * Super admin can update/delete any resource
 * Regular admin can only update/delete their own resources
 */
exports.checkOwnership = (
  tableName,
  idParam = "id",
  ownerField = "administrator_id"
) => {
  return async (req, res, next) => {
    try {
      // Super admin can access everything
      if (req.isSuperAdmin) {
        return next();
      }

      // For regular admin, check ownership
      const resourceId = req.params[idParam];

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `${idParam} is required`,
        });
      }

      // Check if resource exists and belongs to the admin
      const query = `SELECT * FROM ${tableName} WHERE id = ? AND ${ownerField} = ?`;
      const [rows] = await db
        .promise()
        .query(query, [resourceId, req.administratorId]);

      if (rows.length === 0) {
        // Check if resource exists at all
        const checkQuery = `SELECT * FROM ${tableName} WHERE id = ?`;
        const [checkRows] = await db.promise().query(checkQuery, [resourceId]);

        if (checkRows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Resource not found",
          });
        }

        // Resource exists but doesn't belong to this admin
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only modify your own resources.",
        });
      }

      // Resource belongs to the admin, proceed
      req.resource = rows[0];
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error checking ownership",
        error: error.message,
      });
    }
  };
};

/**
 * Helper function to add ownership filter to queries for regular admins
 * Super admin: returns empty filter (can see all)
 * Regular admin: returns filter to show only their data
 */
exports.getOwnershipFilter = (req, ownerField = "administrator_id") => {
  // If isSuperAdmin is true, return empty filter (can see all)
  if (req.isSuperAdmin === true) {
    return { whereClause: "", params: [] };
  }

  // For regular admins, filter by administrator_id
  // Note: checkAdminPermission middleware was called first
  console.log(req.administratorId);

  if (req.administratorId) {
    return {
      whereClause: `WHERE ${ownerField} = ?`,
      params: [req.administratorId],
    };
  }

  // Fallback: if neither super admin nor admin ID is set, return empty (shouldn't happen if middleware is used correctly)
  return { whereClause: "", params: [] };
};
