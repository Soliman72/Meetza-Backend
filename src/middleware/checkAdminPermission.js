const administratorRepository = require("../repositories/administratorRepository");

exports.checkAdminPermission = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    if (req.user.role !== "Administrator" && req.user.role !== "Super_Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrators or Super Admins only.",
      });
    }

    const isSuperAdminFromUserTable = req.user.role === "Super_Admin";
    let isSuperAdmin = isSuperAdminFromUserTable;

    const adminRows = await administratorRepository.getAdministratorByUserId(req.user.id);
    
    let adminRole = req.user.role;

    if (adminRows.length > 0) {
      const adminRecord = adminRows[0];
      adminRole = adminRecord.role;
      isSuperAdmin = adminRole === "Super_Admin" || isSuperAdminFromUserTable;
    } else {
      if (!isSuperAdminFromUserTable) {
        return res.status(403).json({
          success: false,
          message: "Administrator record not found",
        });
      }
    }

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

exports.getOwnershipFilter = (req, ownerField = "administrator_id") => {
  if (req.isSuperAdmin === true || req.user.role === "Super_Admin") {
    return { whereClause: "", params: [] };
  }

  if (req.administratorId || req.user.role === "Administrator") {
    return {
      whereClause: `WHERE ${ownerField} = ?`,
      params: [req.user.id],
    };
  }

  return { whereClause: "", params: [] };
};
