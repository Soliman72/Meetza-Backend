const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

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
  },
  // Absolute paths to files where APIs are defined
  apis: [
    path.join(__dirname, "../router/*.js"),
    path.join(__dirname, "../controller/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

