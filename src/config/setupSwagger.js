const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

function setupSwagger(app) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Meetza API Docs",
      customCss: `
      /* Hide default Swagger logo image */
      .swagger-ui .topbar-wrapper .link img {
        display: none !important;
      }
      
      #logo_small_svg__SW_TM-logo-on-dark {
        display: none !important;
      }

      /* Insert custom Meetza icon logo before the link */
      .swagger-ui .topbar-wrapper .link:before {
        content: "";
        display: inline-block;
        width: 40px;
        height: 40px;
        margin-right: 10px;
        background-image: url("https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_kd3j3a.png");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        vertical-align: middle;
      }

      /* Insert Meetza wordmark beside the logo */
      .swagger-ui .topbar-wrapper .link:after {
        content: "";
        display: inline-block;
        width: 120px;
        height: 40px;
        background-image: url("https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_name_dqrdvl.png");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        vertical-align: middle;
      }

      /* Replace "Swagger UI" text with "Meetza" */
      .swagger-ui .topbar-wrapper .link .logo__title {
        position: relative;
        font-size: 20px !important;
        font-weight: 700 !important;
        color: transparent !important; /* hide original text */
      }
      .swagger-ui .topbar-wrapper .link .logo__title:before {
        content: "Meetza";
        position: absolute;
        left: 0;
        top: 0;
        color: #ffffff;
      }
    `,
    }),
  );

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

module.exports = setupSwagger;
