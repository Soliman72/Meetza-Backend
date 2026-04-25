const { v4: uuidv4 } = require("uuid");
const db = require("../../src/config/db");
const domains = require("../data/domainData");

async function seedDomains() {
  for (let domain of domains) {
    const [existing] = await db.promise().query(
      "SELECT * FROM organization_domain WHERE domain_name = ?",
      [domain.domain_name]
    );

    if (existing.length === 0) {
      const id = uuidv4();
      await db.promise().query(
        "INSERT INTO organization_domain (id, domain_name, auth_email_enabled, auth_google_enabled) VALUES (?, ?, ?, ?)",
        [id, domain.domain_name, domain.auth_email_enabled, domain.auth_google_enabled]
      );
    }
  }

  console.log("Domains Seeded");
}

module.exports = seedDomains;
