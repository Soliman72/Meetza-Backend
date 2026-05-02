const groupRepo = require("../repositories/groupRepository");

exports.attachAdminsToGroups = async (groups) => {
    if (!Array.isArray(groups) || groups.length === 0) return groups;
  
    const groupIds = groups.map((g) => g.id);
  
    const admins = await groupRepo.getAdminsByGroupIds(groupIds);
  
    const adminsByGroup = admins.reduce((acc, row) => {
      if (!acc[row.group_id]) acc[row.group_id] = [];
      acc[row.group_id].push(row);
      return acc;
    }, {});
  
    return groups.map((group) => ({
      ...group,
      admins: adminsByGroup[group.id] || [],
    }));
};