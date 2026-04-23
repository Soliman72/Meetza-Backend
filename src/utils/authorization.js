exports.isAdminAccess = (user, from) => {
    return (
      from === "dashboard" &&
      user.role !== "Administrator" &&
      user.role !== "Super_Admin"
    );
  };