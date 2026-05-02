/**
 * Standalone leaders (e.g. Super Admin) — not tied to a specific group.
 * Per-group leaders live under `admin` inside each entry in `groupData.js`.
 */
module.exports = [
  {
    name: "Super Admin",
    email: "superadmin@company.com",
    role: "Super_Admin",
  },
  {
    name: "Admin 1",
    email: "admin1@company.com",
    role: "Administrator",
  },
];
