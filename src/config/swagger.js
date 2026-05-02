const path = require("path");
const fs = require("fs");
const swaggerJsdoc = require("swagger-jsdoc");

const ROUTE_PREFIXES = {
  administratorRoute: "/api/administrator",
  authRoute: "/api/auth",
  chatBotRoute: "/api/chat-bot",
  chatRoute: "/api/chat",
  commentRoute: "/api/comment",
  companyRoute: "/api/companies",
  contactRoute: "/api/contact",
  domainRoute: "/api/organization-domain",
  group_memberShipRoute: "/api/group-membership",
  groupContentRoute: "/api/group-contents",
  groupRoute: "/api/group",
  homeRoute: "/api/home",
  likeRoute: "/api/like",
  meetingRoute: "/api/meeting",
  memberRoute: "/api/member",
  notificationRoute: "/api/notification",
  positionRoute: "/api/position",
  profileRoute: "/api/profile",
  reportRoute: "/api/reports",
  saved_videoRoute: "/api/saved_video",
  social_authRoute: "/api/social_auth",
  userRoute: "/api/user",
  videoRoute: "/api/video",
  videoWatchProgressRoute: "/api/video",
};

function buildAutoPaths() {
  const routesDir = path.join(__dirname, "../routes");
  const paths = {};

  for (const fileName of fs.readdirSync(routesDir)) {
    if (!fileName.endsWith(".js")) continue;

    const routeName = fileName.replace(".js", "");
    const prefix = ROUTE_PREFIXES[routeName];
    if (!prefix) continue;

    const fullPath = path.join(routesDir, fileName);
    const fileContent = fs.readFileSync(fullPath, "utf8");
    const endpointRegex =
      /router\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g;

    let match;
    while ((match = endpointRegex.exec(fileContent)) !== null) {
      const method = match[1].toLowerCase();
      const routePath = match[2].replace(/:([A-Za-z0-9_]+)/g, "{$1}");
      const fullEndpointPath =
        routePath === "/" ? prefix : `${prefix}${routePath}`;

      if (!paths[fullEndpointPath]) {
        paths[fullEndpointPath] = {};
      }

      if (!paths[fullEndpointPath][method]) {
        paths[fullEndpointPath][method] = {
          summary: `${method.toUpperCase()} ${fullEndpointPath}`,
          tags: [routeName.replace(/Route$/, "")],
          responses: {
            200: { description: "Success" },
          },
        };
      }
    }
  }

  return paths;
}

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Meetza API",
      version: "1.0.0",
      description:
        "REST API documentation for the Meetza backend. This documentation is generated automatically from JSDoc-style comments.",
    },
    servers: [
      {
        url: "http://localhost:" + (process.env.PORT || 3000),
        description: "Local server",
      },
    ],
    paths: buildAutoPaths(),
  },
  // Absolute paths to files where APIs are defined
  apis: [
    path.join(__dirname, "../routes/**/*.js"),
    path.join(__dirname, "../controllers/**/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

