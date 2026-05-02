/**
 * Each group includes its leader (`admin`). That user is created as
 * `Administrator` and linked via `group_admin` (OWNER) when seeds run.
 */
module.exports = [
  {
    group_name: "AI Team",
    description: "Responsible for AI features",
    year: "4",
    semester: "Fall",
    group_photo: null,
    admin: {
      name: "AI Team Leader",
      email: "ai-leader@meetza.com",
      role: "Administrator",
    },
  },
  {
    group_name: "Backend Team",
    description: "Handles APIs and databases",
    year: "3",
    semester: "Spring",
    group_photo: null,
    admin: {
      name: "Backend Team Leader",
      email: "backend-leader@meetza.com",
      role: "Administrator",
    },
  },
];
